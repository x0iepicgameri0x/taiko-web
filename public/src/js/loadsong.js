class loadSong{
	constructor(selectedSong, autoPlayEnabled, multiplayer, touchEnabled){
		this.selectedSong = selectedSong
		this.autoPlayEnabled = autoPlayEnabled
		this.multiplayer = multiplayer
		this.touchEnabled = touchEnabled
		loader.changePage("loadsong")
		this.run()
	}
	run(){
		var id = this.selectedSong.folder
		var promises = []
		assets.sounds["start"].play()
		
		promises.push(new Promise((resolve, reject) => {
			var img = document.createElement("img")
			pageEvents.load(img).then(resolve, () => {
				this.selectedSong.defaultBg = true
				resolve()
			})
			img.id = "music-bg"
			img.src = "/songs/" + id + "/bg.png"
			document.getElementById("assets").appendChild(img)
		}))
		
		promises.push(new Promise((resolve, reject) => {
			var songObj
			assets.songs.forEach(song => {
				if(song.id == id){
					songObj = song
				}
			})
			if(songObj.sound){
				songObj.sound.gain = snd.musicGain
				resolve()
			}else{
				snd.musicGain.load("/songs/" + id + "/main.mp3").then(sound => {
					songObj.sound = sound
					resolve()
				}, reject)
			}
		}))
		promises.push(loader.ajax(this.getOsuPath(this.selectedSong)).then(data => {
			this.songData = data.replace(/\0/g, "").split("\n")
		}))
		Promise.all(promises).then(() => {
			this.setupMultiplayer()
		}, error => {
			console.error(error)
			alert("An error occurred, please refresh")
		})
	}
	getOsuPath(selectedSong){
		return "/songs/" + selectedSong.folder + "/" + selectedSong.difficulty + ".osu"
	}
	setupMultiplayer(){
		if(this.multiplayer){
			var loadingText = document.getElementsByClassName("loading-text")[0]
			var waitingText = "Waiting for Another Player..."
			loadingText.firstChild.data = waitingText
			loadingText.setAttribute("alt", waitingText)
			
			this.song2Data = this.songData
			this.selectedSong2 = this.selectedSong
			pageEvents.add(p2, "message", event => {
				if(event.type === "gameload"){
					if(event.value === this.selectedSong.difficulty){
						p2.send("gamestart")
					}else{
						this.selectedSong2 = {
							title: this.selectedSong.title,
							folder: this.selectedSong.folder,
							difficulty: event.value
						}
						loader.ajax(this.getOsuPath(this.selectedSong2)).then(data => {
							this.song2Data = data.replace(/\0/g, "").split("\n")
							p2.send("gamestart")
						}, () => {
							p2.send("gamestart")
						})
					}
				}else if(event.type === "gamestart"){
					this.clean()
					loader.changePage("game")
					var taikoGame1 = new Controller(this.selectedSong, this.songData, false, 1, this.touchEnabled)
					var taikoGame2 = new Controller(this.selectedSong2, this.song2Data, true, 2)
					taikoGame1.run(taikoGame2)
				}
			})
			p2.send("join", {
				id: this.selectedSong.folder,
				diff: this.selectedSong.difficulty
			})
		}else{
			this.clean()
			loader.changePage("game")
			var taikoGame = new Controller(this.selectedSong, this.songData, this.autoPlayEnabled, false, this.touchEnabled)
			taikoGame.run()
		}
	}
	clean(){
		pageEvents.remove(p2, "message")
	}
}
