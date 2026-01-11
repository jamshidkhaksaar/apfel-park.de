<?php
// [tm-dropcap]D[/tm-dropcap]
// [tm-dropcap style="square"]A[/tm-dropcap]
// [tm-dropcap style="rounded"]B[/tm-dropcap]
// [tm-dropcap style="round"]C[/tm-dropcap]
// [tm-dropcap color="skincolor"]A[/tm-dropcap]
// [tm-dropcap color="grey"]B[/tm-dropcap]
// [tm-dropcap color="dark"]B[/tm-dropcap]
// [tm-dropcap bgcolor="skincolor"]A[/tm-dropcap]
// [tm-dropcap bgcolor="grey"]B[/tm-dropcap]
// [tm-dropcap bgcolor="dark"]B[/tm-dropcap]
if( !function_exists('themetechmount_sc_dropcap') ){
function themetechmount_sc_dropcap( $atts, $content=NULL ){
	extract( shortcode_atts( array(
		'style'   => '',
		'color'   => 'skincolor',
		'bgcolor' => '',
	), $atts ) );
	
	if( empty($color) ){
		$color = 'skincolor';
	}
	
	$class = array();
	$class[] = 'tm-dropcap';
	$class[] = 'tm-dcap-style-' . $style;
	$class[] = 'tm-dcap-txt-color-' . $color;
	$class[] = 'tm-' . $color;
	$class[] = 'tm-bgcolor-' . $bgcolor;
	
	$class = implode( ' ', $class );
	
	return '<span class="' . themetechmount_sanitize_html_classes($class) . '">' . esc_attr($content) . '</span>';
}
}
add_shortcode( 'tm-dropcap', 'themetechmount_sc_dropcap' );