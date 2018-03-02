/**
 * Created by Admin on 2016/5/9.
 */
$(function(){
    var $backToTopEle = $('.toTop'), $backToTopFun = function() {
        var st = $(document).scrollTop(), winh = $(window).height();
        (st > 200) ? $backToTopEle.fadeIn('slow') : $backToTopEle.fadeOut('slow');
        //IE6下的定位
        if (!window.XMLHttpRequest) {
            $backToTopEle.css("top", st + winh - 166);
        }
    };
    $('.toTop').click(function() {
        $("html, body").animate({ scrollTop: 0 }, 200);
    })
    $backToTopEle.hide();
    $backToTopFun();
    $(window).bind("scroll", $backToTopFun);
    $('#catalogWord').click(function(){
        $("#catalog").slideToggle(600);
    })
})