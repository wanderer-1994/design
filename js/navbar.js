$(document).ready(() => {
    let edge = 150;
    $(window).on("scroll.navbar", () => {
        if($(window).scrollTop() > edge && !$(".header .nav-bar").hasClass("collapse")){
            edge -= 100;
            $(".header .nav-bar").removeClass("full");
            $(".header .nav-bar").addClass("collapse");
            $(".header .user").removeClass("full");
            $(".header .user").addClass("collapse");
            $(".header").addClass("transparent");
        }else if($(window).scrollTop() < edge && !$(".header .nav-bar").hasClass("full")) {
            edge += 100;
            $(".header .nav-bar").removeClass("collapse");
            $(".header .nav-bar").addClass("full");
            $(".header .user").removeClass("collapse");
            $(".header .user").addClass("full");
            $(".header").removeClass("transparent");
        }
    })
})