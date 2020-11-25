$(document).ready(() => {
    let content_items = $(".content .content_item");
    let show_index = 1;
    let inactive_index = 0;
    $(content_items[0]).addClass("active");
    setInterval(() => {
        for(let i = 0; i < content_items.length; i++){
            if(i == show_index){
                $(content_items[i]).addClass("active");
            }else if(i == inactive_index){
                $(content_items[i]).removeClass("active");
                $(content_items[i]).addClass("inactive");
            }else{
                $(content_items[i]).removeClass("inactive");
            }
        }
        inactive_index = show_index;
        if(show_index > content_items.length - 2) {
            show_index = 0;
        } else {
            show_index += 1;
        }
    }, 3000);
})