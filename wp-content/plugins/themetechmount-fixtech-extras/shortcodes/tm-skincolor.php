<?php
// [tm-skincolor]This text will be in skin color[/tm-skincolor]
if( !function_exists('themetechmount_sc_skincolor') ){
function themetechmount_sc_skincolor( $atts, $content=NULL ) {
	return '<span class="themetechmount-skincolor tm-skincolor">'.$content.'</span>';
}
}
add_shortcode( 'tm-skincolor', 'themetechmount_sc_skincolor' );