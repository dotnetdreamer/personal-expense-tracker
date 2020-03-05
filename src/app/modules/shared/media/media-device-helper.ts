import { Injectable, Injector } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { ModalController, AlertController, ToastController, ActionSheetController, Platform } from '@ionic/angular';
import { 
    MediaCapture, MediaFile , CaptureVideoOptions 
} from '@ionic-native/media-capture/ngx';
import { File, IFile, DirectoryEntry, FileEntry } from '@ionic-native/file/ngx';
import { Media, MediaObject } from '@ionic-native/media/ngx';
import { MediaFileType, MediaReturnFileType } from './media.model';
import { AppConstant } from '../../shared/app-constant';
import { LocalizationService } from '../../shared/localization.service';
import { Observable, Observer } from 'rxjs';
import { HelperService } from '../../shared/helper.service';
import { MediaConstant } from './media-constant';

declare const cordova: any;

@Injectable({
    providedIn: 'root'
})
export class MediaDeviceHelper {
    constructor(private injector: Injector, private modalCtrl: ModalController
    //  private videoEditor: VideoEditor,
    , private toastCtrl: ToastController,  private file: File
    , private media: Media, private platform: Platform
    , private alertCtrl: AlertController, private camera: Camera, private mediaCapture: MediaCapture
    , private actionSheetCtrl: ActionSheetController, private helperSvc: HelperService
    , private localizationService: LocalizationService) {

    }

    presentMediaOptionsDialog(args: { mediaType: MediaFileType, returnFileType: MediaReturnFileType
        , withCropper?:boolean , validateFormatAndSize?: boolean
        , displayRemoveLink?: boolean, removeLinkCallback? }) {
        return new Promise(async (resolve, reject) => {
            const resources = await Promise.all([
                this.localizationService.getResource('common.chooseoption'),
                this.localizationService.getResource('common.camera'),
                this.localizationService.getResource('common.gallery'),
                this.localizationService.getResource('common.done'),
                this.localizationService.getResource('common.delete'),
            ]);

            const btns = [{
                text: resources[1],
                icon: 'camera',
                cssClass: 'camera',
                handler: () => {
                    actionSheet.dismiss('camera');
                }
            }, {
                text: resources[2],
                icon: 'image-outline',
                cssClass: 'gallery',
                handler: () => {
                    actionSheet.dismiss('gallery');
                }
            }, {
                text: resources[3],
                icon: 'close',
                role: 'cancel',
                handler: () => {
                    actionSheet.dismiss(null);
                }
            }];

            if(args.displayRemoveLink) {
                btns.push({
                    text: resources[4],
                    icon: 'trash',
                    role: 'destructive',
                    handler: () => {
                        actionSheet.dismiss(null);
                        
                        if(args.removeLinkCallback) {
                            args.removeLinkCallback();
                        }
                    }
                });
            }
            const actionSheet = await this.actionSheetCtrl.create({
                header: resources[0],
                buttons: btns
            });
            await actionSheet.present();

            const { data } = await actionSheet.onDidDismiss();
            
            //for testing in browser
            if(!this.platform.is('cordova') 
                && args.mediaType === MediaFileType.Picture && data
                && args.returnFileType == MediaReturnFileType.DATA_URL) {
                const testImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWBAMAAADOL2zRAAAAG1BMVEXMzMyWlpaqqqq3t7fFxcW+vr6xsbGjo6OcnJyLKnDGAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABAElEQVRoge3SMW+DMBiE4YsxJqMJtHOTITPeOsLQnaodGImEUMZEkZhRUqn92f0MaTubtfeMh/QGHANEREREREREREREtIJJ0xbH299kp8l8FaGtLdTQ19HjofxZlJ0m1+eBKZcikd9PWtXC5DoDotRO04B9YOvFIXmXLy2jEbiqE6Df7DTleA5socLqvEFVxtJyrpZFWz/pHM2CVte0lS8g2eDe6prOyqPglhzROL+Xye4tmT4WvRcQ2/m81p+/rdguOi8Hc5L/8Qk4vhZzy08DduGt9eVQyP2qoTM1zi0/uf4hvBWf5c77e69Gf798y08L7j0RERERERERERH9P99ZpSVRivB/rgAAAABJRU5ErkJggg==';
                resolve(testImg);
                return;
            }

            if(data === 'camera') {
                //let the animation complete
                setTimeout(async () => {
                    let returnedDataOrPath;
                    if(args.mediaType === MediaFileType.Picture) {
                        let cameraPic;
                        if(args.withCropper) {
                            // cameraPic = await this.getPictureFromCameraWithCropper();
                        } else {
                            cameraPic = await this.getPictureFromCameraOrGallery({ returnFileType: args.returnFileType });
                        }
                        if(args.validateFormatAndSize) {
                            returnedDataOrPath = await this.validateDataSizeAndFormat(cameraPic
                                , args.mediaType, args.returnFileType);
                            resolve(returnedDataOrPath);
                        } else {
                            resolve(returnedDataOrPath);
                        }
                    } else if (args.mediaType === MediaFileType.Video) {
                        let media = await this.getVideoFromCamera();
                        let thumbnail = null 
                        //await this.generateThumbnailFromVideo(media.fullPath);

                        if(args.validateFormatAndSize) {
                            returnedDataOrPath = await this.validateDataSizeAndFormat(
                                media.fullPath, args.mediaType, args.returnFileType);
                            if(!returnedDataOrPath) {
                                resolve();
                            } else {
                                resolve({ clip: returnedDataOrPath, thumbnail: thumbnail });
                            }
                        } else {
                            resolve({ clip: media.fullPath, thumbnail: thumbnail });
                        }
                    }
                }, 200);                
            } else if(data === 'gallery') {
                //let the animation complete
                setTimeout(async () => {
                    if(args.mediaType === MediaFileType.Picture) {
                        let imageStringOrPath;
                        try {
                            if(args.withCropper) {
                                // imageStringOrPath = await this.getPictureFromFileWithCropper();
                            } else {
                                imageStringOrPath = await this.getPictureFromFile(args.returnFileType);
                            }
                        } catch(e) {
                            reject(e);
                            return;
                        }
                        if(args.validateFormatAndSize) {
                            imageStringOrPath = await this.validateDataSizeAndFormat(imageStringOrPath
                                , args.mediaType, args.returnFileType);
                            resolve(imageStringOrPath);
                        } else {
                            resolve(imageStringOrPath);
                        }
                    } else if (args.mediaType === MediaFileType.Video) {
                        let mediaPath: string = await this.getVideoFromFile();
                        let thumbnail = null 
                        //await this.generateThumbnailFromVideo(mediaPath);                        

                        if(args.validateFormatAndSize) {
                            mediaPath = await this.validateDataSizeAndFormat(mediaPath, args.mediaType, args.returnFileType);
                            if(!mediaPath) {
                                resolve();
                            } else {
                                resolve({ clip: mediaPath, thumbnail: thumbnail });
                            }
                        } else {
                            resolve({ clip: mediaPath, thumbnail: thumbnail });
                        }
                    }
                }, 200);
            } else {
                resolve();                    
            }
        });
    }

    getPictureFromFile(returnFileType: MediaReturnFileType) {
        return new Promise(async (resolve, reject) => {
            const imageStr = await this.getPictureFromCameraOrGallery(
                { returnFileType: returnFileType, displayGalleryOnly: true });
            if(imageStr) {
                resolve(imageStr);
            } else {
                resolve();
            }
        });
    }

    getPictureFromCameraOrGallery(args: { returnFileType: MediaReturnFileType, displayGalleryOnly? }) {
        let destinationType = this.camera.DestinationType.DATA_URL;
        if(args.returnFileType != this.camera.DestinationType.DATA_URL) {
            if(this.platform.is('ios')) {
                destinationType = this.camera.DestinationType.NATIVE_URI;
            } else if(this.platform.is('android')) {
                destinationType = this.camera.DestinationType.FILE_URI; 
            }
        }

        const options: CameraOptions = {
            sourceType: args.displayGalleryOnly ? this.camera.PictureSourceType.PHOTOLIBRARY : this.camera.PictureSourceType.CAMERA,
            quality: 60,
            correctOrientation: true, /* important in iOS as it rotates the image */
            // targetWidth: 400,
            // destinationType: this.camera.DestinationType.DATA_URL,
            destinationType: destinationType,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.PICTURE
        }
        
        return this.camera.getPicture(options).then((imageData) => { 
                  
            var filePath;     
            if(imageData) {
                filePath = destinationType == MediaReturnFileType.DATA_URL ? 'data:image/jpeg;base64,' + imageData : imageData;
            } else {
                return '';
            }
            
            return filePath;
            
        });
    }

    getVideoFromCamera(): Promise<MediaFile> {
        const options: CaptureVideoOptions = {
            limit: 1,
            duration: 20,
            quality: 60     
        };
        return this.mediaCapture.captureVideo(options).then((mediaFiles) => {
            return mediaFiles[0];
        });       
    }

    getVideoFromFile() {
        const options: CameraOptions = {
            quality: 60,
            sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
            destinationType: this.camera.DestinationType.DATA_URL,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.VIDEO
        }

        return this.camera.getPicture(options).then((videoData) => {
            return videoData;
        });          
    }

    validateDataSizeAndFormat(pathOrData, fileType: MediaFileType, returnFileType: MediaReturnFileType): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let allowedFormats;
            let allowedMaxSize;
            if(fileType == MediaFileType.Video) {
                allowedFormats = MediaConstant.MEDIA_VIDEO_ACCEPTED_FORMATS.split(',');
                allowedMaxSize = MediaConstant.MEDIA_VIDEO_ACCEPTED_SIZE;
            } else if(fileType == MediaFileType.Audio) {
                allowedFormats = MediaConstant.MEDIA_AUDIO_ACCEPTED_FORMATS.split(',');
                allowedMaxSize = MediaConstant.MEDIA_AUDIO_ACCEPTED_SIZE;
            } else if(fileType == MediaFileType.Picture) {
                allowedFormats = MediaConstant.MEDIA_IMAGE_ACCEPTED_FORMATS.split(',');
                allowedMaxSize = MediaConstant.MEDIA_IMAGE_ACCEPTED_SIZE;
            } else if(fileType == MediaFileType.Document) {
                allowedFormats = MediaConstant.MEDIA_DOCUMENT_ACCEPTED_FORMATS.split(',');
                allowedMaxSize = MediaConstant.MEDIA_DOCUMENT_ACCEPTED_SIZE;
            }

            //validate format
            let type;
            if(returnFileType == MediaReturnFileType.FILE_URI_OR_NATIVE_URI) {
                //take from path the extension
                let paths = pathOrData.split('.');
                let fileInfo = paths[paths.length - 1];
                type = fileInfo.split('?')[0];
            } else if(returnFileType == MediaReturnFileType.DATA_URL) {
                type = pathOrData.split(';')[0].split('/')[1];
            }
            const isValidFormat = await this._validateFormat(type, allowedFormats);
            if(!isValidFormat) {
                resolve();
                return;
            }

            //validate size
            if(returnFileType == MediaReturnFileType.DATA_URL) {
                let imgStrOnly = (<string>pathOrData).split(',')[1];
                let size = this._getBase64Size(imgStrOnly);

                const result = await this._validateSize(size, allowedMaxSize);
                if(!result) {
                    resolve();
                } else {
                    resolve(pathOrData);
                }
            } else if(returnFileType == MediaReturnFileType.FILE_URI_OR_NATIVE_URI) {
                let tempUrl = pathOrData;
                //android fix:
                if(!tempUrl.startsWith('file://')) {
                    tempUrl = 'file://' + tempUrl;
                }
                let arr = tempUrl.split('/');
                //get last element
                let fileName = arr.pop();
                tempUrl = arr.join('/');
        
                let directoryEntry: DirectoryEntry;
                let fileEntry: FileEntry;
                try {
                    directoryEntry = await this.file.resolveDirectoryUrl(tempUrl);
                } catch (e) {
                    if(AppConstant.DEBUG) {
                        console.log('Can not resolve file path: ' + JSON.stringify(e));
                    }
                    resolve();
                }
                try {
                    fileEntry = await this.file.getFile(directoryEntry, fileName, { create: true, exclusive: false});
                } catch (e) {
                    if(AppConstant.DEBUG) {
                        console.log('Can not resolve file directory: ' + JSON.stringify(e));
                    }
                    resolve();
                }
                fileEntry.file(async (file: IFile) => {
                    const result = await this._validateSize(file.size, allowedMaxSize);
                    if(!result) {
                        resolve();
                    } else {
                        resolve(pathOrData);
                    }
                });
            }
        });
    }

    startAudioRecorder(): Promise<{ recorder, path }> {
        return new Promise(async (resolve, reject) => {              
            let mediaObj: MediaObject;
            try {
                let tempRecorder;
                let cacheDirectory = cordova.file.cacheDirectory;
                const rand = this.helperSvc.getRandomNumber();

                //for iOS it has to be .caf extension
                if(this.platform.is('ios')) {
                    tempRecorder = `${rand}_audio.m4a`;
                } else if(this.platform.is('android')) {
                    tempRecorder = `${rand}_audio.m4a`;
                }
                if(AppConstant.DEBUG) {
                    console.log('MediaService: startAudioRecorder: Creating file');
                }
                await this.file.createFile(cacheDirectory, tempRecorder, true);

                const path = cacheDirectory.replace(/^file:\/\//, '');
                const fullPath = `${path}${tempRecorder}`;

                if(AppConstant.DEBUG) {
                    console.log('MediaService: startAudioRecorder: Creating media');
                }
                mediaObj = this.media.create(fullPath);
                mediaObj.startRecord();

                // setTimeout(() => {
                //     mediaObject.stopRecord();
                //     mediaObject.release();
                //     /** Do something with the record file and then delete */
                //     this.file.removeFile(this.file.tempDirectory, 'record.m4a');
                // }, 10000);
                if(AppConstant.DEBUG) {
                    console.log('MediaService: startAudioRecorder: Media returned');
                }
                resolve({ recorder: mediaObj, path: fullPath });
            } catch (e) {
                if(mediaObj) {
                    mediaObj.stopRecord();
                }
                reject(e);
            }
        });
    }

    async stopAudioRecorder(recorder) {
        if(!recorder) {
            return;
        }

        try {
            const r: MediaObject = recorder;
            r.stopRecord();
            r.release();

        } catch (e) {
            if(AppConstant) {
                console.log('stopAudioRecorder', e);
            }
        }
    }

    playAudio(filePath, statusUpdateCallback?): Promise<MediaObject> {
        return new Promise((resolve, reject) => {
            if(AppConstant.DEBUG) {
                console.log('MediaService: playAudio: filePath', filePath);
            }
            const file: MediaObject = this.media.create(filePath);

            // to listen to plugin events:
            file.onStatusUpdate.subscribe(status => statusUpdateCallback ? statusUpdateCallback(status) : null); // fires when file status changes
            file.onSuccess.subscribe(() => resolve(file));
            file.onError.subscribe(e => reject(e));

            // play the file
            file.play();
        });
    }

    stopAudioPlay(file) {
        const f: MediaObject = file;
        // stop playing the file
        f.stop();

        // release the native audio resource
        // Platform Quirks:
        // iOS simply create a new instance and the old one will be overwritten
        // Android you must call release() to destroy instances of media when you are done
        f.release();
    }

    private async _validateFormat(orignalFileFormat, allowedFormats) {
        return new Promise(async (resolve, reject) => {
            if(!allowedFormats.includes(orignalFileFormat.toLowerCase())) {
                let maxFileSizeMsg = await this.localizationService.getResource('common.media_format_invalid');
                maxFileSizeMsg = maxFileSizeMsg.format(allowedFormats);
                await this.presentToast(maxFileSizeMsg);

                resolve(false);
                return;
            } else {
                resolve(true);
            }
        });
    }

    private async _validateSize(orignalFileSize, allowedMaxSize) {
        return new Promise(async (resolve, reject) => {
            orignalFileSize = Math.round((orignalFileSize / 1000) / 1000);
            if(AppConstant.DEBUG) {
                console.log(`validateVideoSizeAndFormat: size:${orignalFileSize} - maxSize:${allowedMaxSize}`);
            }
            if(orignalFileSize > allowedMaxSize) {
                let maxFileSizeMsg = await this.localizationService.getResource('common.media_size_invalid');
                maxFileSizeMsg = maxFileSizeMsg.format(allowedMaxSize.toString(), orignalFileSize.toString());
                await this.presentToast(maxFileSizeMsg);

                resolve(false);
            } else {
                resolve(true);
            }
        });
    }

    /**
     * @param base64String 
     * each char represents 6 bits (2^6 == 64, hence the Base64). 
     * So times the amount of chars you have by 6 to get the total number of bits. 
     * Then divide the total number of bits by 8 to get the amount of bytes, because a byte is 8 bits.
     * https://stackoverflow.com/a/37109064/859968
     */
    private _getBase64Size(base64String) {
        let bytes = base64String.length * 6 / 8;
        let kBtyes = bytes / 1000;
        let mbBytes = kBtyes/ 1000;

        let size = Math.round(mbBytes);
        return size;
    }

    private getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private presentToast(message) {
        return new Promise(async (resolve, reject)=> {
            let closeBtnTxt = await this.localizationService.getResource('label.dismiss');               
            const toast = await this.toastCtrl.create({
                message: message,
                duration: 5000,
                position: 'bottom',
                buttons: [{ text: closeBtnTxt }]
            });  
            toast.present().then(() => {
                resolve();
            });
        });
    }

    private getFilename(url){
        if (url){    

            if (typeof url.toString() !== 'string') throw new Error('url must be a string');
            // Remove the QueryString
            return url.toString().replace(/\?.*$/, '')
            // Extract the filename
            .split('/').pop();
            // Remove the extension
            //.replace(/\.[^.]+$/, '');

        }
        return "";
    }

    /**
     * This function will handle the conversion from a file to base64 format
     *
     * @path string
     * @callback function receives as first parameter the content of the image
     */

    // private getFileContentAsBase64(path, callback){
    //     this.file.resolveLocalFilesystemUrl(path).then((entryValue) => {
            
    //     })
    
    
    //     function fail(e) {
    //           alert('Cannot found requested file');
    //     }

    //     function gotFile(fileEntry) {
    //            fileEntry.file(function(file) {
    //               var reader = new FileReader();
    //               reader.onloadend = function(e) {
    //                    var content = this.result;
    //                    callback(content);
    //               };
    //               // The most important point, use the readAsDatURL Method from the file plugin
    //               reader.readAsDataURL(file);
    //            });
    //     }
    // }

    getBase64ImageFromURL(url: string) {
        return Observable.create((observer: Observer<string>) => {
        let img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        if (!img.complete) {
            img.onload = () => {
            observer.next(this.getBase64Image(img));
            observer.complete();
            };
            img.onerror = (err) => {
            observer.error(err);
            };
        } else {
            observer.next(this.getBase64Image(img));
            observer.complete();
        }
        });
    }

    getBase64Image(img: HTMLImageElement) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL("image/png");
        return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
      }


    
}