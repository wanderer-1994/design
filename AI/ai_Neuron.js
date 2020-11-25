function Neuron () {
    this.body = document.createElement("div");
    this.x = Math.floor(Math.random() * 890);
    this.y = Math.floor(Math.random() * 590);
    this.width = Math.floor(Math.random() * 20 + 20);
    this.height = Math.floor(Math.random() * 20 + 20);
    this.shape = Math.floor(Math.random() * 100);
    this.bgColor = Math.floor(Math.random()*3);
    if(this.bgColor == 3) this.bgColor = 2;
    this.bgColor = bgColor[this.bgColor];
    
    $(this.body).css({
        "position": "absolute",
        "left": `${this.x}px`,
        "top": `${this.y}px`,
        "width": `${this.width}px`,
        "height": `${this.height}px`,
        "border-radius": `${this.shape}%`,
        "background": `${this.bgColor}`,
        "cursor": "pointer",
        "transform": "translateX(-50%) translateY(-50%)",
    });

    $("body").append(this.body);
}