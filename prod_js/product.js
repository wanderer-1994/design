$(document).ready(function (index, value) {
    $(".gallerry").on("click.gallerryRotate", function () {
        let img_items = $(this).find(".image-item");
        img_items.each(function () {
            let nth = parseInt($(this).css("--nth")) + 1;
            let total = parseInt($(this).css("--total"));
            $(this).css("--nth", nth);
            if (nth % total === 0) {
                $(".gallerry").find(".main-image").css({
                    "background-image": $(this).find(".absolute").css("background-image"),
                    "background-size": "cover",
                    "background-position": "center"
                }
                )
            }
        })
    })
})