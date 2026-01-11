<?php

/* Options for ThemetechMount Heading and Subheading */

$h2_custom_heading = vc_map_integrate_shortcode( 'tm-custom-heading', 'h2_', esc_attr__( 'Heading', 'fixtech' ),
	array(
		'exclude' => array(
			'source',
			'text',
			'css',
		),
	),
	array(
		'element' => 'use_custom_fonts_h2',
		'value'   => 'true',
	)
);

// This is needed to remove custom heading _tag and _align options.
if ( is_array( $h2_custom_heading ) && ! empty( $h2_custom_heading ) ) {
	foreach ( $h2_custom_heading as $key => $param ) {
		if ( is_array( $param ) && isset( $param['type'] ) && 'font_container' === $param['type'] ) {
			$h2_custom_heading[ $key ]['value'] = '';
			if ( isset( $param['settings'] ) && is_array( $param['settings'] ) && isset( $param['settings']['fields'] ) ) {
				$sub_key = array_search( 'tag', $param['settings']['fields'] );
				if ( false !== $sub_key ) {
					unset( $h2_custom_heading[ $key ]['settings']['fields'][ $sub_key ] );
				} elseif ( isset( $param['settings']['fields']['tag'] ) ) {
					unset( $h2_custom_heading[ $key ]['settings']['fields']['tag'] );
				}
				$sub_key = array_search( 'text_align', $param['settings']['fields'] );
				if ( false !== $sub_key ) {
					unset( $h2_custom_heading[ $key ]['settings']['fields'][ $sub_key ] );
				} elseif ( isset( $param['settings']['fields']['text_align'] ) ) {
					unset( $h2_custom_heading[ $key ]['settings']['fields']['text_align'] );
				}
			}
		}
	}
}
$h4_custom_heading = vc_map_integrate_shortcode( 'tm-custom-heading', 'h4_', esc_attr__( 'Subheading', 'fixtech' ),
	array(
		'exclude' => array(
			'source',
			'text',
			'css',
		),
	),
	array(
		'element' => 'use_custom_fonts_h4',
		'value' => 'true',
	)
);

// This is needed to remove custom heading _tag and _align options.
if ( is_array( $h4_custom_heading ) && ! empty( $h4_custom_heading ) ) {
	foreach ( $h4_custom_heading as $key => $param ) {
		if ( is_array( $param ) && isset( $param['type'] ) && 'font_container' === $param['type'] ) {
			$h4_custom_heading[ $key ]['value'] = '';
			if ( isset( $param['settings'] ) && is_array( $param['settings'] ) && isset( $param['settings']['fields'] ) ) {
				$sub_key = array_search( 'tag', $param['settings']['fields'] );
				if ( false !== $sub_key ) {
					unset( $h4_custom_heading[ $key ]['settings']['fields'][ $sub_key ] );
				} elseif ( isset( $param['settings']['fields']['tag'] ) ) {
					unset( $h4_custom_heading[ $key ]['settings']['fields']['tag'] );
				}
				$sub_key = array_search( 'text_align', $param['settings']['fields'] );
				if ( false !== $sub_key ) {
					unset( $h4_custom_heading[ $key ]['settings']['fields'][ $sub_key ] );
				} elseif ( isset( $param['settings']['fields']['text_align'] ) ) {
					unset( $h4_custom_heading[ $key ]['settings']['fields']['text_align'] );
				}
			}
		}
	}
}
$params = array_merge(
	array(
		array(
			'type'             => 'textarea',
			'heading'          => esc_attr__( 'Heading', 'fixtech' ),
			'admin_label'      => true,
			'param_name'       => 'h2',
			'value'            => '',
			'description'      => esc_attr__( 'Enter text for heading line.', 'fixtech' ),
			'edit_field_class' => 'vc_col-sm-9 vc_column',
		),
		array(
			'type'             => 'checkbox',
			'heading'          => esc_attr__( 'Use custom font?', 'fixtech' ),
			'param_name'       => 'use_custom_fonts_h2',
			'description'      => esc_attr__( 'Enable Google fonts.', 'fixtech' ),
			'edit_field_class' => 'vc_col-sm-3 vc_column',
		),

	),
	$h2_custom_heading,
	array(
		array(
			'type'             => 'textarea',
			'heading'          => esc_attr__( 'Subheading', 'fixtech' ),
			'param_name'       => 'h4',
			'value'            => '',
			'description'      => esc_attr__( 'Enter text for subheading line.', 'fixtech' ),
			'edit_field_class' => 'vc_col-sm-9 vc_column',
		),
		array(
			'type'             => 'checkbox',
			'heading'          => esc_attr__( 'Use custom font?', 'fixtech' ),
			'param_name'       => 'use_custom_fonts_h4',
			'description'      => esc_attr__( 'Enable custom font option.', 'fixtech' ),
			'edit_field_class' => 'vc_col-sm-3 vc_column',
		),
	),
	
	$h4_custom_heading,
	
	array(
		array(
			'type'       => 'textarea_html',
			'heading'    => esc_attr__( 'Text', 'fixtech' ),
			'param_name' => 'content',
			'value'      => esc_attr__( 'I am promo text. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'fixtech' )
		),
		array(
			'type'        => 'dropdown',
			'heading'     => esc_attr__( 'Text alignment', 'fixtech' ),
			'param_name'  => 'txt_align',
			'std'		  => 'left',
			'value'       => themetechmount_getVcShared( 'text align' ), // default left
			'description' => esc_attr__( 'Select text alignment in "Call to Action" block.', 'fixtech' ),
		),
		array(
			'type'             => 'checkbox',
			'heading'          => esc_attr__( 'Reverse heading order', 'fixtech' ),
			'param_name'       => 'reverse_heading',
			'description'      => esc_attr__( 'Show sub-heading before heading.', 'fixtech' ),
			'std'			   => 'true',
		),
		array(
			'type'             => 'checkbox',
			'heading'          => esc_attr__( 'Overlay Subheading', 'fixtech' ),
			'param_name'       => 'overlay_subheading',
			'description'      => esc_attr__( 'Show heading overlay Subheading.', 'fixtech' ),
			'std'			   => 'true',
		),
		array(
			'type'        => 'dropdown',
			'heading'     => esc_attr__( 'Seperator', 'fixtech' ),
			'param_name'  => 'seperator',
			'value'       => array(
				esc_attr__( 'Solid', 'fixtech' )		=> 'solid',
				esc_attr__( 'None', 'fixtech' )			=> 'none',
			),
			'description' => esc_attr__( 'Show separator between Heading and Subheading', 'fixtech' ),
			'std'		  => 'none',
		),
		array(
			'type'        => 'dropdown',
			'heading'     => esc_attr__( 'Heading Style', 'fixtech' ),
			'param_name'  => 'heading_style',
			'value'       => array(
				esc_attr__( 'Vertical (Default)', 'fixtech' )	=> 'vertical',
				esc_attr__( 'Horizontal', 'fixtech' )			=> 'horizontal',
			),
			'description' => esc_attr__( 'Select Heading Style', 'fixtech' ),
			'std'  		  => 'vertical',
			'dependency'  => array(
					'element'            => 'seperator',
					'value_not_equal_to' => array( 'after_before' ),
				),
		),

	),

	array(
		/// cta3
		vc_map_add_css_animation(),
		themetechmount_vc_ele_extra_class_option(),
		themetechmount_vc_ele_css_editor_option(),
	)
);
	
global $tm_sc_params_heading;
$tm_sc_params_heading = $params;

vc_map( array(
	'name'     => esc_attr__( 'ThemetechMount Heading and Subheading', 'fixtech' ),
	'base'     => 'tm-heading',
	'icon'     => 'icon-themetechmount-vc',
	'category' => array( esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ) ),
	'since'    => '4.5',
	'params'   => $params,
	'js_view'  => 'VcCallToActionView3',
) );