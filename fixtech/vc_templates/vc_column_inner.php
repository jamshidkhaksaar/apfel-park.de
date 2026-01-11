<?php
if ( ! defined( 'ABSPATH' ) ) {
	die( '-1' );
}

/**
 * Shortcode attributes
 * @var $atts
 * @var $el_class
 * @var $el_id
 * @var $width
 * @var $css
 * @var $offset
 * @var $content - shortcode content
 * Shortcode class
 * @var $this WPBakeryShortCode_VC_Column_Inner
 */
$el_class = $width = $el_id = $css = $offset = '';
$output = '';
$atts = vc_map_get_attributes( $this->getShortcode(), $atts );
extract( $atts );

$width = wpb_translateColumnWidthToSpan( $width );
$width = vc_column_offset_class_merge( $offset, $width );

$css_classes = array(
	$this->getExtraClass( $el_class ),
	'wpb_column',
	'tm-column-inner',
	'vc_column_container',
	$width,
);

if ( vc_shortcode_custom_css_has_property( $css, array(
	'border',
	'background',
) ) ) {
	$css_classes[] = 'vc_col-has-fill';
}


/**** ThemetechMount custom changes START ****/

$tm_customdiv 	= '';
$tm_class_list 	= '';
$tm_classes 	= array();
if( !empty($tm_textcolor) ){
	$tm_classes[] = 'tm-textcolor-'.$tm_textcolor;
}
if( !empty($tm_bgcolor) || themetechmount_check_if_bgcolor_in_css($css) ){
	$tm_classes[] = 'tm-col-bgcolor-'.$tm_bgcolor;
	$tm_classes[] = 'tm-col-bgcolor-yes';
	$tm_customdiv = '<div class="tm-col-wrapper-bg-layer tm-bg-layer"><div class="tm-bg-layer-inner"></div></div>';
}
if( strpos($css, 'url(') !== false ) {
	$tm_classes[] = 'tm-col-bgimage-yes';
	$tm_customdiv = '<div class="tm-col-wrapper-bg-layer tm-bg-layer"><div class="tm-bg-layer-inner"></div></div>';
}
if( !empty($tm_shadow) ){ // Shadow
	$tm_classes[] = 'tm-colum-shadow-box-inner';
}
if( !empty($tm_zindex) ){
	if( $tm_zindex=='zero' ){ $tm_zindex='0'; }
	$css_classes[] = 'tm-zindex-'.$tm_zindex;
}
$tm_classes[] 	= themetechmount_responsive_padding_margin_class( $tm_responsive_css );
$tm_class_list = implode( ' ', $tm_classes );

/**** ThemetechMount custom changes End ****/


/**** ThemetechMount custom changes START ****/
if( !empty($reduce_extra_padding) ){
	$css_classes[] = 'margin-15px-' . esc_attr($reduce_extra_padding) . '-colum';
}
/**** ThemetechMount custom changes END ****/



$wrapper_attributes = array();

$css_class = preg_replace( '/\s+/', ' ', apply_filters( VC_SHORTCODE_CUSTOM_CSS_FILTER_TAG, implode( ' ', array_filter( $css_classes ) ), $this->settings['base'], $atts ) );
$wrapper_attributes[] = 'class="' . esc_attr( trim( $css_class ) ) . '"';
if ( ! empty( $el_id ) ) {
	$wrapper_attributes[] = 'id="' . esc_attr( $el_id ) . '"';
}

/***** Modified by ThemetechMount - START *****/
?>

<div <?php echo implode( ' ', $wrapper_attributes ); ?>>
	<div class="vc_column-inner <?php echo esc_attr( trim( vc_shortcode_custom_css_class( $css ) ). ' ' . themetechmount_sanitize_html_classes( $tm_class_list ) ); ?>">
		<?php echo themetechmount_wp_kses($tm_customdiv); // Added by ThemetechMount  ?> 
		<div class="wpb_wrapper">
			<?php echo wpb_js_remove_wpautop( $content ); ?>
		</div>
	</div>
</div>

<?php
/***** Modified by ThemetechMount - END *****/



/**** Added by ThemetechMount - code start ****/
$customStyle = '';
if(trim($css)!= ''){
	// Inline css
	global $themetechmount_inline_css;
	if( empty($themetechmount_inline_css) ){
		$themetechmount_inline_css = '';
	}
	// background image layer
	$new_bgimage_element    = vc_shortcode_custom_css_class( $css, '' ). ' > .tm-col-wrapper-bg-layer';
	$newCSS   			    = str_replace( vc_shortcode_custom_css_class( $css, '' ),$new_bgimage_element,$css );
	$themetechmount_inline_css .= themetechmount_vc_get_bg_css_only( $newCSS );
	
	// background color layer
	$new_bgimage_element2   = vc_shortcode_custom_css_class( $css, '' ). ' > .tm-col-wrapper-bg-layer > .tm-bg-layer-inner';
	$newCSS2   			    = str_replace( vc_shortcode_custom_css_class( $css, '' ),$new_bgimage_element2,$css );
	$themetechmount_inline_css .= themetechmount_vc_get_bg_css_only( $newCSS2, 'nobg' );
	
}

// Responsive padding margin option values
if( !empty($tm_responsive_css) ){

		global $themetechmount_inline_css;
		if( empty($themetechmount_inline_css) ){
			$themetechmount_inline_css = '';
		}
		$themetechmount_inline_css .= themetechmount_responsive_padding_margin( $tm_responsive_css, '.tm-column-inner>' );
}
	
/**** Added by ThemetechMount - code end ****/