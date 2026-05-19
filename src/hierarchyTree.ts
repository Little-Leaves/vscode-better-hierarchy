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
        this.iconPath = this.getIconForSymbolKind(this.callItem.from.kind);
    }

    getIconForSymbolKind(kind: vscode.SymbolKind): vscode.ThemeIcon {
        switch (kind) {
            case vscode.SymbolKind.File:
                return new vscode.ThemeIcon("symbol-file", new vscode.ThemeColor("symbolIcon.fileForeground"));
            case vscode.SymbolKind.Module:
                return new vscode.ThemeIcon("symbol-module",  new vscode.ThemeColor("symbolIcon.moduleForeground"));
            case vscode.SymbolKind.Namespace:
                return new vscode.ThemeIcon("symbol-namespace",  new vscode.ThemeColor("symbolIcon.namespaceForeground"));
            case vscode.SymbolKind.Package:
                return new vscode.ThemeIcon("symbol-package",  new vscode.ThemeColor("symbolIcon.packageForeground"));
            case vscode.SymbolKind.Class:
                return new vscode.ThemeIcon("symbol-class",  new vscode.ThemeColor("symbolIcon.classForeground"));
            case vscode.SymbolKind.Method:
                return new vscode.ThemeIcon("symbol-method",  new vscode.ThemeColor("symbolIcon.methodForeground"));
            case vscode.SymbolKind.Property:
                return new vscode.ThemeIcon("symbol-property",  new vscode.ThemeColor("symbolIcon.propertyForeground"));
            case vscode.SymbolKind.Field:
                return new vscode.ThemeIcon("symbol-field",  new vscode.ThemeColor("symbolIcon.fieldForeground"));
            case vscode.SymbolKind.Constructor:
                return new vscode.ThemeIcon("symbol-constructor",  new vscode.ThemeColor("symbolIcon.constructorForeground"));
            case vscode.SymbolKind.Enum:
                return new vscode.ThemeIcon("symbol-enum",  new vscode.ThemeColor("symbolIcon.enumForeground"));
            case vscode.SymbolKind.Interface:
                return new vscode.ThemeIcon("symbol-interface",  new vscode.ThemeColor("symbolIcon.interfaceForeground"));
            case vscode.SymbolKind.Function:
                return new vscode.ThemeIcon("symbol-function",  new vscode.ThemeColor("symbolIcon.functionForeground"));
            case vscode.SymbolKind.Variable:
                return new vscode.ThemeIcon("symbol-variable",  new vscode.ThemeColor("symbolIcon.variableForeground"));
            case vscode.SymbolKind.Constant:
                return new vscode.ThemeIcon("symbol-constant",  new vscode.ThemeColor("symbolIcon.constantForeground"));
            case vscode.SymbolKind.String:
                return new vscode.ThemeIcon("symbol-string",  new vscode.ThemeColor("symbolIcon.stringForeground"));
            case vscode.SymbolKind.Number:
                return new vscode.ThemeIcon("symbol-number",  new vscode.ThemeColor("symbolIcon.numberForeground"));
            case vscode.SymbolKind.Boolean:
                return new vscode.ThemeIcon("symbol-boolean",  new vscode.ThemeColor("symbolIcon.booleanForeground"));
            case vscode.SymbolKind.Array:
                return new vscode.ThemeIcon("symbol-array",  new vscode.ThemeColor("symbolIcon.arrayForeground"));
            case vscode.SymbolKind.Object:
                return new vscode.ThemeIcon("symbol-object",  new vscode.ThemeColor("symbolIcon.objectForeground"));
            case vscode.SymbolKind.Key:
                return new vscode.ThemeIcon("symbol-key",  new vscode.ThemeColor("symbolIcon.keyForeground"));
            case vscode.SymbolKind.Null:
                return new vscode.ThemeIcon("symbol-null",  new vscode.ThemeColor("symbolIcon.nullForeground"));
            case vscode.SymbolKind.EnumMember:
                return new vscode.ThemeIcon("symbol-enum-member",  new vscode.ThemeColor("symbolIcon.enumeratorMemberForeground"));
            case vscode.SymbolKind.Struct:
                return new vscode.ThemeIcon("symbol-struct",  new vscode.ThemeColor("symbolIcon.structForeground"));
            case vscode.SymbolKind.Event:
                return new vscode.ThemeIcon("symbol-event",  new vscode.ThemeColor("symbolIcon.eventForeground"));
            case vscode.SymbolKind.Operator:
                return new vscode.ThemeIcon("symbol-operator",  new vscode.ThemeColor("symbolIcon.operatorForeground"));
            case vscode.SymbolKind.TypeParameter:
                return new vscode.ThemeIcon("symbol-type-parameter", new vscode.ThemeColor("symbolIcon.typeParameterForeground"));
            default:
                // 对于未知的类型，返回一个通用的符号图标
                return new vscode.ThemeIcon("symbol-misc");
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

    async handleGotoCallItemPosition(callItem: vscode.CallHierarchyIncomingCall) {
        const document = await vscode.workspace.openTextDocument(callItem.from.uri);
        const editor =  await vscode.window.showTextDocument(document);
        editor.revealRange(callItem.fromRanges[0], vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        editor.setDecorations(HierarchyTreeDataProvider.hoverLikeDecorationType, callItem.fromRanges);
        editor.selection = new vscode.Selection(callItem.fromRanges[0].start, callItem.fromRanges[0].start);
    }
}