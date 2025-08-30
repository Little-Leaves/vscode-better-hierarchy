// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HierarchyTreeDataProvider } from './hierarchyTree';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const hierarchyTreeDataProvider = new HierarchyTreeDataProvider();
	const hierarchyTreeView = vscode.window.createTreeView("betterHierarchyCalls", { treeDataProvider: hierarchyTreeDataProvider });
	hierarchyTreeDataProvider.treeView = hierarchyTreeView;
	context.subscriptions.push(hierarchyTreeView);
	context.subscriptions.push(vscode.commands.registerCommand("betterHierarchy.gotoPosition",
		hierarchyTreeDataProvider.handleGotoCallItemPosition.bind(hierarchyTreeDataProvider)));
	context.subscriptions.push(vscode.commands.registerCommand("betterHierarchy.RefreshSession",
		hierarchyTreeDataProvider.handleRefreshSession.bind(hierarchyTreeDataProvider)));
	context.subscriptions.push(vscode.commands.registerCommand("betterHierarchy.RefreshAllSessions",
		hierarchyTreeDataProvider.handleRefreshAllSessions.bind(hierarchyTreeDataProvider)));
	context.subscriptions.push(vscode.commands.registerCommand("betterHierarchy.CloseSession",
		hierarchyTreeDataProvider.handleDeleteSession.bind(hierarchyTreeDataProvider)));
	context.subscriptions.push(vscode.commands.registerCommand("betterHierarchy.CloseAllSessions",
		hierarchyTreeDataProvider.handleDeleteAllSessions.bind(hierarchyTreeDataProvider)));
	context.subscriptions.push(vscode.commands.registerCommand("betterHierarchy.showHierarchy",
		hierarchyTreeDataProvider.handleNewHierarchyTree.bind(hierarchyTreeDataProvider)));
	context.subscriptions.push(vscode.commands.registerCommand("betterHierarchy.FixSession",
		(root) => hierarchyTreeDataProvider.handleFixSession(root, true)));
	context.subscriptions.push(vscode.commands.registerCommand("betterHierarchy.CancelFixSession",
		(root) => hierarchyTreeDataProvider.handleFixSession(root, false)));
}

// This method is called when your extension is deactivated
export function deactivate() { }
