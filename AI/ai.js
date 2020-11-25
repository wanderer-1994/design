$("body").css({
    "position": "relative",
    "width": "900px",
    "height": "600px",
    "border": "1px solid gray",
    "overflow": "hidden",
    "margin": "0",
    "padding": "0"
});

let bgColor = ["#e91e63", "#9c27b0", "#8bc34a"];

function DangerManager () {
    this.dangerList = [];
    setInterval(() => {
        this.dangerList.push(new Danger(this.dangerList));
    }, 1000);
}

var dangerMgr = new Neuron();

$(window).on("click.getcolor", async (event) => {
    let canvas = await html2canvas($("body")[0]);
    let coor_x = event.clientX;
    let coor_y = event.clientY;
    let ctx = canvas.getContext("2d");
    console.log(ctx.getImageData(coor_x, coor_y, 1, 1));
})