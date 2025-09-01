import path, { join } from 'path';
import * as vscode from 'vscode';
import { IconsDir } from './constant';

class HierarchyTreeItem extends vscode.TreeItem {

    callItem: vscode.CallHierarchyIncomingCall;
    childs?: HierarchyTreeItem[];
    root: HierarchyTreeRoot;
    parent?: HierarchyTreeItem;

    constructor(
        public override readonly label: string,
        public override collapsibleState: vscode.TreeItemCollapsibleState,
        callItem: vscode.CallHierarchyIncomingCall,
        root: HierarchyTreeRoot,
        parent?: HierarchyTreeItem,
    ) {
        super(label, collapsibleState);
        this.callItem = callItem;
        this.tooltip = this.label;
        this.root = root;
        this.parent = parent;
        this.setIcon();
        this.command = {
            command: "betterHierarchy.gotoPosition",
            title: "",
            arguments: [this.callItem],
        };

        if (callItem.fromRanges.length > 1) {
            this.description = `× ${callItem.fromRanges.length}`;
            if (callItem.from.detail && callItem.from.detail !== "") {
                this.description += ` | ${callItem.from.detail}`;
            }
        }
        else {
            this.description = `${callItem.from.detail || ""}`;
        }
    }

    setIcon() {
        this.iconPath = new vscode.ThemeIcon(this.getIconForSymbolKind(this.callItem.from.kind));
    }

    getIconForSymbolKind(kind: vscode.SymbolKind): string {
        switch (kind) {
            case vscode.SymbolKind.File:
                return 'symbol-file';
            case vscode.SymbolKind.Module:
                return 'symbol-module';
            case vscode.SymbolKind.Namespace:
                return 'symbol-namespace';
            case vscode.SymbolKind.Package:
                return 'symbol-package';
            case vscode.SymbolKind.Class:
                return 'symbol-class';
            case vscode.SymbolKind.Method:
                return 'symbol-method';
            case vscode.SymbolKind.Property:
                return 'symbol-property';
            case vscode.SymbolKind.Field:
                return 'symbol-field';
            case vscode.SymbolKind.Constructor:
                return 'symbol-constructor';
            case vscode.SymbolKind.Enum:
                return 'symbol-enum';
            case vscode.SymbolKind.Interface:
                return 'symbol-interface';
            case vscode.SymbolKind.Function:
                return 'symbol-function';
            case vscode.SymbolKind.Variable:
                return 'symbol-variable';
            case vscode.SymbolKind.Constant:
                return 'symbol-constant';
            case vscode.SymbolKind.String:
                return 'symbol-string';
            case vscode.SymbolKind.Number:
                return 'symbol-number';
            case vscode.SymbolKind.Boolean:
                return 'symbol-boolean';
            case vscode.SymbolKind.Array:
                return 'symbol-array';
            case vscode.SymbolKind.Object:
                return 'symbol-object';
            case vscode.SymbolKind.Key:
                return 'symbol-key';
            case vscode.SymbolKind.Null:
                return 'symbol-null';
            case vscode.SymbolKind.EnumMember:
                return 'symbol-enum-member';
            case vscode.SymbolKind.Struct:
                return 'symbol-struct';
            case vscode.SymbolKind.Event:
                return 'symbol-event';
            case vscode.SymbolKind.Operator:
                return 'symbol-operator';
            case vscode.SymbolKind.TypeParameter:
                return 'symbol-type-parameter';
            default:
                // 对于未知的类型，返回一个通用的符号图标
                return 'symbol-misc';
        }
    }
}

class HierarchyTreeRoot extends HierarchyTreeItem {
    static IconPath: vscode.IconPath = {
        dark: vscode.Uri.file(path.join(IconsDir, "calls_dark.svg")),
        light: vscode.Uri.file(path.join(IconsDir, "calls_light.svg"))
    };
    static IconPathFixed: vscode.IconPath = {
        dark: vscode.Uri.file(path.join(IconsDir, "calls_dark_fixed.svg")),
        light: vscode.Uri.file(path.join(IconsDir, "calls_light_fixed.svg"))
    };

    update: boolean = false;
    fixed: boolean = false;

    constructor(
        public override readonly label: string,
        public override collapsibleState: vscode.TreeItemCollapsibleState,
        callItem: vscode.CallHierarchyItem,
    ) {
        super(label, collapsibleState, { from: callItem, fromRanges: [callItem.selectionRange] }, null!);
        this.setFixed(false);
        this.root = this;
    }

    override setIcon(): void {
        this.iconPath = this.fixed ? HierarchyTreeRoot.IconPathFixed : HierarchyTreeRoot.IconPath;
    }

    setFixed(fixed: boolean) {
        this.fixed = fixed;
        this.contextValue = fixed ? "HierarchyTreeRootFixed" : "HierarchyTreeRoot";
        this.setIcon();
    }

    refresh(emitter: vscode.EventEmitter<HierarchyTreeItem | undefined>) {
        this.update = true;
        emitter.fire(this);
    }

    notifyRefreshResolve() {
        this.update = false;
    }

    private rangeOverlap(range1: vscode.Range, range2: vscode.Range) {
        if (range1.start.line > range2.end.line || range2.start.line > range1.end.line) {
            return false;
        }
        return true;
    }

    private sameItem(item: vscode.CallHierarchyItem, another: vscode.CallHierarchyItem): boolean {
        if (item.uri.fsPath !== another.uri.fsPath
            || !(item.name === another.name || item.name.split("::").pop() === another.name.split("::").pop())
            || !this.rangeOverlap(item.range, another.range)) {
            return false;
        }
        return true;
    }

    // 三层以内存在同名的节点，则不重新建立根节点
    getTreeItemWithinThreeLayers(item: vscode.CallHierarchyItem): HierarchyTreeItem | undefined {
        if (this.sameItem(this.callItem.from, item)) {
            return this;
        }

        for (const c2 of this.childs || []) {
            if (this.sameItem(c2.callItem.from, item)) {
                return c2;
            }
            for (const c3 of c2.childs || []) {
                if (this.sameItem(c3.callItem.from, item)) {
                    return c3;
                }
            }
        }
    }
}

export class HierarchyTreeDataProvider implements vscode.TreeDataProvider<HierarchyTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<HierarchyTreeItem | undefined>();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    private sessions: HierarchyTreeRoot[] = [];
    private lastEditor?: vscode.TextEditor;
    treeView?: vscode.TreeView<HierarchyTreeItem>;

    // 跳转时使用文本装饰器高亮
    static hoverLikeDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor('editor.hoverHighlightBackground'),
        borderRadius: '2px',
    });

    constructor() { }

    getTreeItem(element: HierarchyTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: HierarchyTreeItem | undefined): Promise<HierarchyTreeItem[]> {
        if (!element) {
            return this.sessions;
        }

        // 惰性刷新
        if (!element.root.update && element.childs) {
            return element.childs;
        }

        const callItems: vscode.CallHierarchyIncomingCall[] = await vscode.commands.executeCommand(
            'vscode.provideIncomingCalls',
            element.callItem.from,
        );

        if (callItems) {
            element.childs = callItems.map(item => {
                return new HierarchyTreeItem(item.from.name, vscode.TreeItemCollapsibleState.Collapsed, item, element.root, element);
            });
        }
        else {
            element.childs = [];
        }

        return element.childs;
    }

    async handleNewHierarchyTree() {
        let editor = vscode.window.activeTextEditor;
        let position = editor?.selection.active;
        if (position) {
            const reference: vscode.CallHierarchyItem[] = await vscode.commands.executeCommand("vscode.prepareCallHierarchy", editor!.document.uri, position);
            if (reference && reference.length) {
                let item = reference[0];

                for (const session of this.sessions) {
                    let existItem: HierarchyTreeItem | undefined;
                    if ((existItem = session.getTreeItemWithinThreeLayers(item))) {

                        // Focus on item already exist
                        existItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
                        existItem.root.update = true;
                        this._onDidChangeTreeData.fire(existItem);
                        this.treeView?.reveal(existItem);
                        return;
                    }
                }

                const newSession = new HierarchyTreeRoot(item.name, vscode.TreeItemCollapsibleState.Expanded, item);

                // 其他跟节点使用惰性刷新
                this.sessions.forEach(r => r.update = false);

                this.sessions.push(newSession);
                this._onDidChangeTreeData.fire(undefined);
                this.treeView?.reveal(newSession);
            }
            else {
                vscode.window.showInformationMessage("No results or Lauguage server not registered");
            }
        }
    }

    handleRefreshSession(session: HierarchyTreeRoot) {
        session.refresh(this._onDidChangeTreeData);
    }

    handleRefreshAllSessions() {
        this.sessions.forEach(session => session.refresh(this._onDidChangeTreeData));
    }

    handleDeleteSession(session: HierarchyTreeRoot) {
        this.sessions.splice(this.sessions.indexOf(session), 1);
        this.sessions.forEach(r => r.update = false);
        this._onDidChangeTreeData.fire(undefined);
    }

    handleDeleteAllSessions() {
        this.sessions = this.sessions.filter(session => {
            session.update = false;
            return session.fixed;
        });
        this._onDidChangeTreeData.fire(undefined);
    }

    handleFixSession(session: HierarchyTreeRoot, fixed: boolean) {
        session.setFixed(fixed);
        this._onDidChangeTreeData.fire(session);
    }

    getParent(element: HierarchyTreeItem): vscode.ProviderResult<HierarchyTreeItem> {
        return element.parent;
    }

    resolveTreeItem?(item: vscode.TreeItem, element: HierarchyTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }

    async getEditor(uri: vscode.Uri) {
        if (this.lastEditor && this.lastEditor.document.uri.fsPath === uri.fsPath) {
            return this.lastEditor;
        }
        else {
            const document = await vscode.workspace.openTextDocument(uri);
            this.lastEditor = await vscode.window.showTextDocument(document);
            return this.lastEditor;
        }
    }

    async handleGotoCallItemPosition(callItem: vscode.CallHierarchyIncomingCall) {
        const editor = await this.getEditor(callItem.from.uri);
        editor.revealRange(callItem.fromRanges[0], vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        editor.setDecorations(HierarchyTreeDataProvider.hoverLikeDecorationType, callItem.fromRanges);
        editor.selection = new vscode.Selection(callItem.fromRanges[0].start, callItem.fromRanges[0].start);
    }
}