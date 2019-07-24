/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import { LiveShare, SharedService } from './liveshare';
import { ConnectionProvider } from './providers/connectionProvider';
import { QueryProvider } from './providers/queryProvider';
import { StatusProvider } from './providers/statusProvider';
import { LiveShareServiceName } from './constants';

declare var require: any;
let vsls = require('vsls');

export class HostSessionManager {
	constructor(
		context: vscode.ExtensionContext,
		vslsApi: LiveShare
	) {
		vslsApi!.onDidChangeSession(async function onLiveShareSessionCHange(e: any) {
			const isHost = e.session.role === vsls.Role.Host;
			if (!isHost) {
				return;
			}

			const sharedService: SharedService = await vslsApi.shareService(LiveShareServiceName);
			if (!sharedService) {
				vscode.window.showErrorMessage('Could not create a shared service. You have to set "liveshare.features" to "experimental" in your user settings in order to use this extension.');
				return;
			}

			new ConnectionProvider(isHost, sharedService);
			let queryProviderMssql = azdata.dataprotocol.getProvider<azdata.QueryProvider>('MSSQL', azdata.DataProviderType.QueryProvider);
			const queryProvider = new QueryProvider(false, queryProviderMssql);
			queryProvider.initialize(true, sharedService);

			new StatusProvider(isHost, vslsApi, sharedService);
		});

		// context.subscriptions.push(sharedService.onDidChangeIsServiceAvailable(available => {
		// //	available ? this.startSession() : this.endSession();
		// }));
	}
}
