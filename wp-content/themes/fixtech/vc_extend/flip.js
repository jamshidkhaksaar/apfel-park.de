!function($) {
    $('.flip-input-text').on('click', function(e) {
		alert('CAlled');
        e.preventDefault();
        var $input = $(this).prev().find('.my_param_field'),
            text = $input.val();
        $input.val(text.split("").reverse().join(""));
    });
}(window.jQuery);