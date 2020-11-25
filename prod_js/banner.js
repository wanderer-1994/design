$(document).ready(() => {

    function slideNext () {
        let current_index = banner_img_index;
        if(banner_img_index == banner_imgs.length - 1){
            banner_img_index = 0;
        }else{
            banner_img_index += 1;
        }
        $(banner_imgs[current_index]).removeClass("active");
        $(trackers[current_index]).removeClass("active");
        $(banner_imgs[banner_img_index]).addClass("active");
        $(trackers[banner_img_index]).addClass("active");
    }

    function slideBack () {
        let current_index = banner_img_index;
        if(banner_img_index == 0){
            banner_img_index = banner_imgs.length - 1;
        }else{
            banner_img_index -= 1;
        }
        $(banner_imgs[current_index]).removeClass("active");
        $(trackers[current_index]).removeClass("active");
        $(banner_imgs[banner_img_index]).addClass("active");
        $(trackers[banner_img_index]).addClass("active");
    }

    function slideTo (index) {
        let current_index = banner_img_index;
        banner_img_index = index;
        $(banner_imgs[current_index]).removeClass("active");
        $(trackers[current_index]).removeClass("active");
        $(banner_imgs[banner_img_index]).addClass("active");
        $(trackers[banner_img_index]).addClass("active");
    }

    function initAutoSlideShow () {
        slide_show = setInterval(() => {
            slideNext();
        }, 4000);
    }

    function addTracker () {
        for(let i = 0; i < banner_imgs.length; i++){
            $(".banner .tracker").append(`<div class="item ${i == banner_img_index ? "active" : ""}" data-index="${i}"></div>`);
        };
        trackers = $(".banner .tracker .item");
    }

    let trackers = [];
    let slide_show;
    var banner_imgs = $(".banner .slider_item");
    var banner_img_index = 0;
    addTracker();
    initAutoSlideShow();

    $(".banner .navigation").on("mouseover.stopautosildeshow", () => {
        clearInterval(slide_show);
    });

    $(".banner .navigation").on("mouseleave.stopautosildeshow", () => {
        initAutoSlideShow();
    });

    $(".banner .navigation.next").on("click.slideNext", () => {
        slideNext();
    });

    $(".banner .navigation.back").on("click.slideBack", () => {
        slideBack();
    });

    $(".banner .tracker .item").on("click.slideTo", (event) => {
        let index = $(event.target).data("index");
        index = parseInt(index);
        slideTo(index);
        clearInterval(slide_show);
        initAutoSlideShow();
    });

    $(".banner .slider_item").on("swipeleft.slideTo", (event) => {
        slideNext();
        clearInterval(slide_show);
        initAutoSlideShow();
    });

    $(".banner").on("swiperight.slideTo", (event) => {
        slideBack();
        clearInterval(slide_show);
        initAutoSlideShow();
    })
})