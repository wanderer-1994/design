$(document).ready(() => {
    function windowHeight () {
        return (window.innerHeight - 65);
    };
    
    function windowWidth () {
        return (window.innerWidth - 65);
    };

    function toggleNavbar ($navBar) {
        if ($navBar.hasClass("open")) {
            $navBar.removeClass("open");
            $("body").css("overflow", "");
            $(document).off("click.navbarclose")
        } else {
            $navBar.addClass("open");
            $("body").css("overflow", "hidden");
        }
    }

    $(".nav-bar").draggable({ limitTop: 0, limitBottom: windowHeight, limitLeft: 0, limitRight: windowWidth });
    $(document).onClickNonDrag({allowX: 5, allowY: 5}, (e) => {
        let $navBar = $(".nav-bar");
        if($(".nav-bar .menu-icon:hover").length > 0) {
            toggleNavbar($navBar);
        } else {
            let $navbar = $(".nav-bar.open");
            if($navbar.length > 0){
                toggleNavbar($navbar);
            }
        }
    });

    $(".filter").draggable({ limitTop: 0, limitBottom: windowHeight, limitLeft: 0, limitRight: windowWidth });
})