import { Injectable } from "@angular/core";

import { File, IFile, DirectoryEntry, FileEntry } from '@ionic-native/file/ngx';

import { AppConstant } from '../app-constant';
import { BaseService } from '../base.service';
import { ImageDataConverter } from './image-data-converter';
import { IMediaFile, MediaOptionType } from './media.model';

@Injectable({
    providedIn: 'root'
})
export class MediaUploaderService extends BaseService {
    constructor(private file: File) {
        super();
    }

    async upload<T>(args: IMediaFile): Promise<Array<T>> { 
        if(!args) {
            throw 'You must pass args';
        }

        if(!args.files || (args.files && !args.files.length)) {
            throw 'You must pass files in Array';
        }

        return new Promise(async (resolve, reject) => {
            let promises = [];
            for(let fly of args.files) {
                const guid = this.helperSvc.generateGuid();   
                let nameWithExtension, data;
                let fd = new FormData();

                if(fly.mediaType == MediaOptionType.LocalFileSystem) {
                    //we are uploading native file stored on device. In this case 'shouldFetchFromLocalFileSystem' will be a path
                    let result: any = await this._uploadFromLocalFileSystem(fly.fileData);
                    data = <Blob>result.blob;
                    let file = <IFile>result.file; 
                    nameWithExtension = guid + '_' + file.name;   
                } else if(fly.mediaType == MediaOptionType.FormData) {
                    //we are uploading a file directly from form data using input type="file"
                    nameWithExtension = guid + '_' + (<IFile>fly.fileData).name;  
                    data = fly.fileData;
                } else if(fly.mediaType == MediaOptionType.Base64String) {
                    //we are uploading a base64 string
                    nameWithExtension = guid + '.' + fly.fileData.split(';')[0].split('/')[1];  
                    const blob = new ImageDataConverter(fly.fileData).dataURItoBlob();
                    data = blob;
                }
                fd.append('file', data, nameWithExtension);

                const localPromise = this._uploadFile(args.serverUrl, fd);               
                promises.push(localPromise);
            }

            try {
                const response = await Promise.all(promises);
                resolve(response);
            } catch (e) {
                reject(e);
            }
        });
    }

    private _uploadFromLocalFileSystem(url: string) {
        return new Promise(async (resolve, reject) => {
            //android fix:
            if(!url.startsWith('file://')) {
                url = 'file://' + url;
            }
            let arr = url.split('/');
            //get last element
            let fileName = arr.pop();
            url = arr.join('/');

            let directoryEntry: DirectoryEntry;
            let fileEntry: FileEntry;

            try {
                directoryEntry = await this.file.resolveDirectoryUrl(url);
            } catch (e) {
                reject(e);
            }
            try {
                fileEntry = await this.file.getFile(directoryEntry, fileName, { create: true, exclusive: false});
            } catch (e) {
                reject(e);
            }
            // console.log('fileEntry: ' + fileEntry);
            fileEntry.file((file: IFile) => {
                // console.log(file);
                let reader = new FileReader();
                // let _component = this;
                reader.onloadend = function() {
                    let self = <any>this;
                    // Create a blob based on the FileReader "result", which we asked to be retrieved as an ArrayBuffer
                    let data = new Uint8Array(self.result);
                    let blob = new Blob([data], { type: file.type });
                    // resolve({ blob: blob, file: file });
                    // console.log(blob);
                    // _component.upload(blob, file.name)
                    // .then(result => {
                    //     console.log(result);
                    // });
                    // var oReq = new XMLHttpRequest();
                    // oReq.open("POST", "http://mysweeturl.com/upload_handler", true);
                    // oReq.onload = function (oEvent) {
                    //     // all done!
                    // };
                    // // Pass the blob in to XHR's send method
                    // oReq.send(blob);
                    resolve({ blob: blob, file: file });
                };
                // Read the file as an ArrayBuffer
                reader.readAsArrayBuffer(file);
            }, (e) => { 
                console.log('Can not read file: ' + JSON.stringify(e));
                reject(e);
            });
        });
    }

    private _uploadFile(url?: string, body?: any, errorHandler?: any): Promise<string> {
        return new Promise(async (resolve, reject) => {
            // let headers = await this.prepareHeaders();
            // headers = headers.delete('Content-Type');
            // // headers = headers.append('Content-Type', 'multipart/form-data');

            // body = body || {};   
            // url = AppConstant.BASE_API_URL + url;                
          
            // const request = this.http.post<any>(url, body, {
            //     headers: headers
            // });

            // request.subscribe(result => {
            //     resolve(result);
            // }, async error => {
            //     // await this.handleError(error, errorHandler, request, resolve, reject);
            // });
        });
    }
}