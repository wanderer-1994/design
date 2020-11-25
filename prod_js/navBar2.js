$(document).ready(() => {
    $(".nav-bar").draggable();
    $(".nav-bar .menu-icon").onClickNonDrag({allowX: 5, allowY: 5}, (event) => {
        let $navBar = $(event.target).parents(".nav-bar").eq(0);
        if ($navBar.hasClass("open")) {
            $navBar.removeClass("open");
            $("body").css("overflow", "");
        } else {
            $navBar.addClass("open");
            $("body").css("overflow", "hidden");
        }
    });
})