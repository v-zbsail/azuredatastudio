/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as vscode from 'vscode';
import { LiveShare, SharedService, SharedServiceProxy } from '../liveshare';
import { ConnectionProvider } from './connectionProvider';

export class LiveShareDocumentState {
	public isConnected: boolean;
	public serverName?: string;
	public databaseName?: string;
}

export class StatusProvider {
	private _sharedService: SharedService;
	private _sharedServiceProxy: SharedServiceProxy;

	public constructor(
		private _isHost: boolean,
		private _vslsApi: LiveShare,
		connectionProvider: ConnectionProvider,
		service: SharedService | SharedServiceProxy) {

		if (this._isHost) {
			this._sharedService = <SharedService>service;
			this.registerStatusProvider();
		} else {
			this._sharedServiceProxy = <SharedServiceProxy>service;

			connectionProvider.onConnect(async (args: any) => {
				if (args && args.profile) {
					let connection = await azdata.connection.connect(args.profile);
					if (connection.errorMessage) {
						console.log(connection.errorMessage);
					}
				}
			});
		}
	}

	private registerStatusProvider(): void {
		let self = this;

		// Retrieves the current document state associated with the URI parameter.
		// The URI will be in guest Live Share format and needs to be converted back
		// to the host file path format.
		this._sharedService.onRequest('getDocumentState', async (args: any[]) => {
			if (args && args.length > 0) {
				let ownerUri =  vscode.Uri.parse(args[0].ownerUri);
				let localUri: vscode.Uri = self._vslsApi.convertSharedUriToLocal(ownerUri);
				let connection = await azdata.connection.getConnection(localUri.toString());

				let serverName: string = 'liveshare';
				let databaseName: string = 'liveshare';
				if (connection) {
					serverName = connection.serverName;
					databaseName = connection.databaseName;
				}

				let documentState: LiveShareDocumentState = {
					isConnected: true,
					serverName: serverName,
					databaseName: databaseName
				};
				return documentState;
			}
			return undefined;
		});
	}

	public getDocumentState(doc: vscode.TextDocument): Promise<LiveShareDocumentState> {
		if (!this._isHost) {
			return this._sharedServiceProxy.request('getDocumentState', [{
				ownerUri: doc.uri.toString()
			}]);
		} else {
			return Promise.resolve(undefined);
		}
	}
}