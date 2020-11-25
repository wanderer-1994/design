function Danger (dangerList) {
    this.mgrList = dangerList;
    this.tttransform = Math.floor(Math.random() * 5 + 3) * 1000;
    this.ttl = Math.floor(Math.random() * 20 + 5) * 1000;
    this.body = document.createElement("div");
    this.x = Math.floor(Math.random() * 890);
    this.y = Math.floor(Math.random() * 590);
    this.radius = Math.floor(Math.random() * 100 + 50);
    this.bgColor = "#9e9e9e50";

    setTimeout(() => {
        this.bgColor = "#ffc10750";
        this.updateBody();
        this.updateTTL();
    }, this.tttransform);

    this.updateBody();

    $("body").append(this.body);
};

Danger.prototype.updateBody = function () {
    $(this.body).css({
        "position": "absolute",
        "left": `${this.x}px`,
        "top": `${this.y}px`,
        "width": `${this.radius}px`,
        "height": `${this.radius}px`,
        "border-radius": `50%`,
        "background": this.bgColor,
        "cursor": "pointer",
        "transform": "translateX(-50%) translateY(-50%)",
    });
};

Danger.prototype.selfDestroy = function () {
    $(this.body).remove();
    let index = this.mgrList.indexOf(this)
    this.mgrList.splice(index, 1);
}

Danger.prototype.updateTTL = function () {
    let ttlInterval = setInterval(() => {
        if(this.ttl <= 0){
            this.selfDestroy();
            clearInterval(ttlInterval);
        };
        this.radius = this.radius  * 0.9;
        this.ttl -= 500;
        this.updateBody();
    }, 500)
}