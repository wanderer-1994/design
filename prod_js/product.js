$(document).ready(() => {
    updateProdNameRotation();
    $(window).on("resize.updateProdNameRotation", updateProdNameRotation);
});

function updateProdNameRotation () {
    $(".product .corner .prod-name").css("display", "none");
    let corner_height = $(".product .corner").css("height");
    corner_height = parseInt(corner_height);
    let rad = Math.atan(corner_height/window.innerWidth);
    let deg = rad * (180/Math.PI);
    let prodNameMarginTop = $(".product .corner .prod-name").css("margin-top");
    prodNameMarginTop = parseInt(prodNameMarginTop);
    let prodNameWidth = Math.sqrt(Math.pow(corner_height, 2) + Math.pow(window.innerWidth, 2)) * prodNameMarginTop/corner_height;
    $(".product .corner .prod-name").css({
        "transform": `rotateZ(-${deg}deg)`,
        "display": "block",
        "width": `${prodNameWidth}px`
    });
}