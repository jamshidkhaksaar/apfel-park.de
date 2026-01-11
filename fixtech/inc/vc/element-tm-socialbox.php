<?php

/* Options */

// Getting social list
$global_social_list = themetechmount_shared_social_list();

$sociallist = array_merge(
	array('' => esc_attr__('Select service','fixtech')),
	$global_social_list,
	array('rss'     => 'Rss Feed')
);
$sociallist = array_flip($sociallist);


$params = array_merge(
	themetechmount_vc_heading_params(),
	array(
		array(
			'type'        => 'param_group',
			'heading'     => esc_attr__( 'Social Services List', 'fixtech' ),
			'param_name'  => 'socialservices',
			'description' => esc_attr__( 'Select social service and add URL for it.', 'fixtech' ).'<br><strong>'.esc_attr__('NOTE:','fixtech').'</strong> '.esc_attr__("You don't need to add URL if you are selecting 'RSS' in the social service",'fixtech'),
			'group'       => esc_attr__( 'Social Services', 'fixtech' ),
			'params'     => array(
				array( // First social service
					'type'        => 'dropdown',
					'heading'     => esc_attr__( 'Select Social Service', 'fixtech' ),
					'param_name'  => 'servicename',
					'std'         => 'none',
					'value'       => $sociallist,
					'description' => esc_attr__( 'Select social service', 'fixtech' ),
					'group'       => esc_attr__( 'Social Services', 'fixtech' ),
					'admin_label' => true,
					'edit_field_class' => 'vc_col-sm-4 vc_column',
				),
				array(
					'type'        => 'textarea',
					'heading'     => esc_attr__( 'Social URL', 'fixtech' ),
					'param_name'  => 'servicelink',
					'dependency'  => array(
						'element'            => 'servicename',
						'value_not_equal_to' => array( 'rss' )
					),
					'value'       => '',
					'description' => esc_attr__( 'Fill social service URL', 'fixtech' ),
					'group'       => esc_attr__( 'Social Services', 'fixtech' ),
					'admin_label' => true,
					'edit_field_class' => 'vc_col-sm-8 vc_column',
				),
			),
		),
		array( // First social service
			'type'        => 'dropdown',
			'heading'     => esc_attr__( 'Select column', 'fixtech' ),
			'param_name'  => 'column',
			'value'       => array(
				esc_attr__('One column','fixtech')   => 'one',
				esc_attr__('Two column','fixtech')   => 'two',
				esc_attr__('Three column','fixtech') => 'three',
				esc_attr__('Four column','fixtech')  => 'four',
				esc_attr__('Five column','fixtech')  => 'five',
				esc_attr__('Six column','fixtech')   => 'six',
			),
			'std'         => 'six',
			'description' => esc_attr__( 'Select how many column will show the social icons', 'fixtech' ),
			'group'       => esc_attr__( 'Social Services', 'fixtech' ),
			'edit_field_class' => 'vc_col-sm-6 vc_column',
		),
		array( // First social service
			'type'        => 'dropdown',
			'heading'     => esc_attr__( 'Social icon size', 'fixtech' ),
			'param_name'  => 'iconsize',
			'std'         => 'large',
			'value'       => array(
				esc_attr__('Small icon','fixtech')  => 'small',
				esc_attr__('Medium icon','fixtech') => 'medium',
				esc_attr__('Large icon','fixtech')  => 'large',
			),
			'description' => esc_attr__( 'Select social icon size', 'fixtech' ),
			'group'       => esc_attr__( 'Social Services', 'fixtech' ),
			'edit_field_class' => 'vc_col-sm-6 vc_column',
		),
	),
	
	array( vc_map_add_css_animation() ),
	array( themetechmount_vc_ele_extra_class_option() ),
	array( themetechmount_vc_ele_css_editor_option() )
	
);

global $tm_sc_params_socialbox;
$tm_sc_params_socialbox = $params;

vc_map( array(
	'name'        => esc_attr__( 'ThemetechMount Social Box', 'fixtech' ),
	'base'        => 'tm-socialbox',
	"icon"        => "icon-themetechmount-vc",
	'category'    => esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ),
	'params'      => $params,
) );