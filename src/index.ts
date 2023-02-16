/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	'url': D1Database;
}
async function randomString() {
	let len = 6;
	let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
	let maxPos = $chars.length;
	let result = '';
	for (let i = 0; i < len; i++) {
		result += $chars.charAt(Math.floor(Math.random() * maxPos));
	}
	return result;
}

async function sha512(url: string) {
	let url1 = new TextEncoder().encode(url)

	const url_digest = await crypto.subtle.digest(
		{
			name: "SHA-512",
		},
		url1, // The data you want to hash as an ArrayBuffer
	)
	const hashArray = Array.from(new Uint8Array(url_digest)); // convert buffer to byte array
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	//console.log(hashHex)
	return hashHex
}


async function checkURL(URL: string) {
	let str = URL;
	let Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
	let objExp = new RegExp(Expression);
	if (objExp.test(str) == true) {
		if (str[0] == 'h')
			return true;
		else
			return false;
	} else {
		return false;
	}
}



export default {
	async fetch(request: Request, env: Env) {
		const { pathname } = new URL(request.url);
		if (pathname == '/api/shorten') {
			const url = await request.text();
			if (await checkURL(url)) {
				let hash = await randomString();
				try {
					//判断url是否存在
					const { results }: any = await env.url.prepare(
						"SELECT * FROM urls WHERE url=?"
					).bind(url).all();
					if (results != null && results != undefined && results.length != 0) {
						const res = { code: 0, data: results[0].hash, msg: 'success' }
						return Response.json(res);
					}
					await env.url.prepare(
						"INSERT INTO urls VALUES (?,?)"
					).bind(hash, url).run();
					const res = { code: 0, data: hash, msg: 'success' }
					return Response.json(res);
				} catch (e: any) {
					const res = { code: -1, data: null, msg: '红豆泥私密马赛，出错了' }
					return Response.json(res);
				}

			}
			else {
				const res = { code: -2, data: null, msg: '你这url有问题啊' }
				return Response.json(res);
			}
		} else {
			const hash = pathname.substring(1);
			try {
				const { results }: any = await env.url.prepare(
					"SELECT * FROM urls WHERE hash=?"
				).bind(hash).all();
				if (results == null || results == undefined || results.length == 0) {
					const res = { code: -2, data: null, msg: '红豆泥私密马赛，没找到' }
					return Response.json(res);
				} else {
					return Response.redirect(results[0].url);
				}
			} catch (e: any) {
				const res = { code: -1, data: null, msg: '红豆泥私密马赛，出错了' }
				return Response.json(res);
			}

		}

	}


}
