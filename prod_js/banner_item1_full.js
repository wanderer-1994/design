(() => {
    let container_div = document.createElement("div");
    $(container_div).addClass("slider_item")
    let shadowDom = container_div.attachShadow({mode: "open"});
    let html = 
    `<div class="wrapper">
        <div class="bgr"></div>
        <div class="container">
            <div class="content">
                <div class="header">HOCO J59</div>
                <div class="content_item item1">
                    <h4>CHÍNH HÃNG HOCO</h4>
                    <h4>10.000 mAh</h4>
                </div>
                <div class="content_item item2">
                    <h4>LÕI POLYMERE LITHIUM</h4>
                    <h4>THIẾT KẾ NHỎ GỌN, TINH TẾ</h4>
                </div>
                <div class="content_item item3">
                    <h4>RINH NGAY VỀ TAY...</h4>
                    <h4>...CHỈ VỚI 209K</h4>
                </div>
            </div>
            <div class="img">
                <img src="../prod_img/banner/hoco_J59.png" alt="">
            </div>
        </div>
    </div>`;

    let css = 
    `<style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @media (min-width: 1001px) {
            body {
                width: 100%;
                height: 70vh;
            }
        
            .wrapper {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
                user-select: none;
            }
        
            .bgr {
                width: 100%;
                height: 100%;
                background: #004ca7;
                position: absolute;
                bottom: 0px;
                z-index: -1;
                clip-path: polygon(0% 60%, 100% 20%, 100% 100%, 0% 100%);
            }
        
            .container {
                width: 90%;
                margin: auto;
                height: 98%;
                background: #0065c3;
                display: flex;
                overflow: hidden;
            }
        
            .container .content {
                position: relative;
                width: 50%;
                height: 100%;
            }
        
            .container .content .header {
                font-size: 60px;
                color: white;
                text-align: center;
                margin-bottom: 10px;
                background: #ababab90;
                margin-top: 13%;
            }
        
            .container .content .content_item {
                text-align: center;
                opacity: 0;
                margin-left: 20%;
                position: absolute;
                top: 40%;
                width: 100%;
            }
        
            .container .content_item.active {
                opacity: 1;
                margin-left: 0%;
                transition: 1s linear;
                transition-delay: 0.5s;
            }
        
            .container .content_item.inactive {
                opacity: 0;
                margin-left: -10%;
                top: 45%;
                transition: 0.5s linear;
                transition-delay: 0.5s;
            }
        
            .container .content .content_item.item1 h4:nth-child(1) {
                font-size: 30px;
                color: white;
                text-align: right;
                padding-right: 20%;
            }
        
            .container .content .content_item.item1 h4:nth-child(2) {
                font-size: 40px;
                text-align: right;
                padding-right: 20%;
                color: #f5407e;
            }
        
            .container .content .content_item.item2 h4 {
                margin-right: -10%;
            }
        
            .container .content .content_item.item2 h4:nth-child(1) {
                font-size: 30px;
                color: white;
                text-align: right;
                padding-right: 20%;
            }
        
            .container .content .content_item.item2 h4:nth-child(2) {
                font-size: 30px;
                color: white;
                text-align: right;
                padding-right: 20%;
                color: #f5407e;
            }
        
            .container .content .content_item.item3 h4:nth-child(1) {
                font-size: 30px;
                color: white;
                text-align: right;
                padding-right: 20%;
            }
        
            .container .content .content_item.item3 h4:nth-child(2) {
                font-size: 30px;
                color: white;
                text-align: right;
                padding-right: 20%;
                color: #f5407e;
            }
        
            .container .img {
                width: 50%;
                height: 100%;
            }
        
            .container .img img{
                margin-left: -20%;
            }
        }
    </style>`;
    $(shadowDom).append(css);
    $(shadowDom).append(html);

    let content_items = $(shadowDom).find(".content .content_item");
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
    $(".banner").append(container_div);
})()