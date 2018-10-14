﻿class About{
	constructor(touchEnabled){
		this.issueTemplate = [
			"###### 下記の問題を説明してください。 スクリーンショットと診断情報を含めてください。",
			"###### Describe the problem you are having below. Please include a screenshot and the diagnostic information."
		]
		
		this.touchEnabled = touchEnabled
		loader.changePage("about")
		cancelTouch = false
		
		this.endButton = document.getElementById("tutorial-end-button")
		this.diagTxt = document.getElementById("diag-txt")
		this.version = document.getElementById("version-link").href
		this.tutorialOuter = document.getElementById("tutorial-outer")
		if(touchEnabled){
			this.tutorialOuter.classList.add("touch-enabled")
		}
		this.linkGithub = document.getElementById("link-github")
		this.linkEmail = document.getElementById("link-email")
		
		pageEvents.add(this.linkGithub, ["click", "touchend"], this.linkButton.bind(this))
		pageEvents.add(this.linkEmail, ["click", "touchend"], this.linkButton.bind(this))
		pageEvents.once(this.endButton, ["mousedown", "touchstart"]).then(this.onEnd.bind(this))
		pageEvents.keyOnce(this, 13, "down").then(this.onEnd.bind(this))
		
		this.gamepad = new Gamepad({
			"confirm": ["start", "b", "ls", "rs"]
		}, this.onEnd.bind(this))
		
		this.addDiag()
	}
	onEnd(event){
		var touched = false
		if(event && event.type === "touchstart"){
			event.preventDefault()
			touched = true
		}
		this.clean()
		assets.sounds["don"].play()
		localStorage.setItem("tutorial", "true")
		setTimeout(() => {
			new SongSelect("about", false, touched)
		}, 500)
	}
	addDiag(){
		var diag = []
		
		diag.push("```")
		diag.push("Taiko-Web version: " + this.version)
		diag.push("User agent: " + navigator.userAgent)
		diag.push("Screen size: " + innerWidth + "x" + innerHeight + ", outer: " + outerWidth + "x" + outerHeight + ", ratio: " + (window.devicePixelRatio || 1).toFixed(2))
		if(this.touchEnabled){
			diag.push("Touch enabled: true")
		}
		if(!fullScreenSupported){
			diag.push("Full screen supported: false")
		}
		diag.push("Blur performance: " + perf.blur + "ms, all images: " + perf.allImg + "ms")
		diag.push("Page load: " + (perf.load / 1000).toFixed(1) + "s")
		if("getGamepads" in navigator){
			var gamepads = navigator.getGamepads()
			for(var i = 0; i < gamepads.length; i++){
				if(gamepads[i]){
					var gamepadDiag = []
					gamepadDiag.push(gamepads[i].id)
					gamepadDiag.push("buttons: " + 	gamepads[i].buttons.length)
					gamepadDiag.push("axes: " + gamepads[i].axes.length)
					diag.push("Gamepad #" + (i + 1) + ": " + gamepadDiag.join(", "))
				}
			}
		}
		var errorObj = {}
		if(localStorage["lastError"]){
			try{
				errorObj = JSON.parse(localStorage["lastError"])
			}catch(e){}
		}
		if(errorObj.timestamp && errorObj.stack){
			if(errorObj.timestamp + 1000 * 60 * 60 * 24 > (+new Date)){
				diag.push("Last error: " + errorObj.stack)
				diag.push("Error date: " + new Date(errorObj.timestamp).toGMTString())
			}else{
				localStorage.removeItem("lastError")
			}
		}
		diag.push("```")
		var diag = diag.join("\n")
		
		if(navigator.userAgent.indexOf("Android") >= 0){
			var iframe = document.createElement("iframe")
			this.diagTxt.appendChild(iframe)
			var body = iframe.contentWindow.document.body
			body.innerText = diag
			
			body.setAttribute("style", `
				font-family: monospace;
				margin: 2px 0 0 2px;
				white-space: pre-wrap;
				word-break: break-all;
				cursor: text;
			`)
			body.setAttribute("onblur", `
				getSelection().removeAllRanges()
			`)
		}else{
			this.textarea = document.createElement("textarea")
			this.textarea.readOnly = true
			this.textarea.value = diag
			this.diagTxt.appendChild(this.textarea)
			if(!this.touchEnabled){
				pageEvents.add(this.textarea, "focus", () => {
					this.textarea.select()
				})
				pageEvents.add(this.textarea, "blur", () => {
					getSelection().removeAllRanges()
				})
			}
		}
		
		var issueBody = this.issueTemplate.join("\n") + "\n\n\n\n" + diag
		this.getLink(this.linkGithub).href += "?body=" + encodeURIComponent(issueBody)
		this.getLink(this.linkEmail).href += "?body=" + encodeURIComponent(issueBody.replace(/\n/g, "\r\n"))
	}
	getLink(target){
		return target.getElementsByTagName("a")[0]
	}
	linkButton(event){
		this.getLink(event.currentTarget).click()
	}
	clean(){
		cancelTouch = true
		this.gamepad.clean()
		pageEvents.remove(this.linkGithub, ["click", "touchend"])
		pageEvents.remove(this.linkEmail, ["click", "touchend"])
		pageEvents.remove(this.endButton, ["mousedown", "touchstart"])
		if(this.textarea){
			pageEvents.remove(this.textarea, ["focus", "blur"])
		}
		pageEvents.keyRemove(this, 13)
		delete this.endButton
		delete this.diagTxt
		delete this.version
		delete this.tutorialOuter
		delete this.linkGithub
		delete this.linkEmail
		delete this.textarea
	}
}
