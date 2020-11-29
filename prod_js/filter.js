$(document).ready(() => {

    function toggleFilter ($filter) {
        if ($filter.hasClass("open")) {
            $filter.removeClass("open");
            $("body").css("overflow", "");
        } else {
            $filter.addClass("open");
            $("body").css("overflow", "hidden");
        }
    }

    $(".filter .filter-icon").on("click.togglefilter", (e) => {
        toggleFilter($(e.target).closest(".filter"));
    })
    
    $(".filter .filter-shadow").on("click.togglefilter", (e) => {
        if($(e.target).hasClass("filter-shadow")) {
            toggleFilter($(e.target).parents(".filter"));
        }
    });
    
})