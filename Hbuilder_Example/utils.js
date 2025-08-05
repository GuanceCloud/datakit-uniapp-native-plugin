export const SERVER_URL = 'http://127.0.0.1:9529'
export const ANDROID_APP_ID = 'android_uniapp_app_id'
export const IOS_APP_ID = 'ios_uniapp_app_id'
export const TRACK_ID = 'track_id'
import gc from './GCRequest.js';
export default {

	getUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0,
				v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},
	request(requestUrl, header = {}) {
		gc.request({
			url: requestUrl,
			header: header,
			success() {
				console.log('success');
			},
			complete() {
				console.log('complete');
			}
		});
	},
	rumRequest(requestUrl,method,header = {}){			
			gc.request({
				url: requestUrl,
				method: method,
				header: header,
				filterPlatform:["ios"],
				timeout:30000,
				success(res)  {
					console.log('success:' + JSON.stringify(res))
				},
				fail(err) {
					console.log('fail:' + JSON.stringify(err))
				},
				complete() {
					console.log('complete')
				}
			});
	}
}
