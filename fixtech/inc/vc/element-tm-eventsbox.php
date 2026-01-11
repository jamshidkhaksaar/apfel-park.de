<?php

/* Options */

$allParams = array(
	array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Box Style", "fixtech"),
		"description" => esc_attr__("Select box style.", "fixtech"),
		"group"       => esc_attr__( "Box Design", "fixtech" ),
		"param_name"  => "view",
		"value"       => array(
			esc_attr__("Default Style", "fixtech")  => "top-image",
			esc_attr__("Detailed Style", "fixtech") => "top-image-details",
		),
		"std"         => "default",
		'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
	),
	array(
		"type"        => "dropdown",
		"holder"      => "div",
		"class"       => "",
		"heading"     => esc_attr__("Show Events Item",'fixtech'),
		"description" => esc_attr__("How many events you want to show.",'fixtech'),
		"param_name"  => "show",
		"value"       => array(
			esc_attr__('All','fixtech') => '-1',
			esc_attr__('1','fixtech')  => '1',
			esc_attr__('2','fixtech') => '2',
			esc_attr__('3','fixtech')=>'3',
			esc_attr__('4','fixtech')=>'4',
			esc_attr__('5','fixtech')=>'5',
			esc_attr__('6','fixtech')=>'6',
			esc_attr__('7','fixtech')=>'7',
			esc_attr__('8','fixtech')=>'8',
			esc_attr__('9','fixtech')=>'9',
			esc_attr__('10','fixtech')=>'10',
			esc_attr__('11','fixtech')=>'11',
			esc_attr__('12','fixtech')=>'12',
			esc_attr__('13','fixtech')=>'13',
			esc_attr__('14','fixtech')=>'14',
			esc_attr__('15','fixtech')=>'15',
			esc_attr__('16','fixtech')=>'16',
			esc_attr__('17','fixtech')=>'17',
			esc_attr__('18','fixtech')=>'18',
			esc_attr__('19','fixtech')=>'19',
			esc_attr__('20','fixtech')=>'20',
			esc_attr__('21','fixtech')=>'21',
			esc_attr__('22','fixtech')=>'22',
			esc_attr__('23','fixtech')=>'23',
			esc_attr__('24','fixtech')=>'24',
		),
		"std"  => "3",
		'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
	),
	array(
		"type"        => "dropdown",
		"holder"      => "div",
		"class"       => "",
		"heading"     => esc_attr__("Show Pagination",'fixtech'),
		"description" => esc_attr__("Show pagination links below Event boxes.",'fixtech'),
		"param_name"  => "pagination",
		"value"       => array(
			esc_attr__('No','fixtech')  => 'no',
			esc_attr__('Yes','fixtech') => 'yes',
		),
		"std"         => "no",
		'dependency'  => array(
			'element'    => 'sortable',
			'value_not_equal_to' => array( 'yes' ),
		),
		'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
	),
	array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Box Spacing", "fixtech"),
		"param_name"  => "box_spacing",
		"description" => esc_attr__("Spacing between each box.", "fixtech"),
		"value"       => array(
			esc_attr__("Default", "fixtech")                        => "",
			esc_attr__("0 pixel spacing (joint boxes)", "fixtech")  => "0px",
			esc_attr__("5 pixel spacing", "fixtech")                => "5px",
			esc_attr__("10 pixel spacing", "fixtech")               => "10px",
		),
		"std"  => "",
		'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
	),
	
);

/**
 * Heading Element
 */
$heading_element = vc_map_integrate_shortcode( 'tm-heading', '', '',
	array(
		'exclude' => array(
			'el_class',
			'css',
			'css_animation'
		),
	)
);

$boxParams = themetechmount_box_params();
$params    = array_merge( $heading_element, $allParams, $boxParams );

// Changing default values
$i = 0;
foreach( $params as $param ){
	$param_name = (isset($param['param_name'])) ? $param['param_name'] : '' ;
	if( $param_name == 'h2' ){
		$params[$i]['std'] = 'Latest Events';
		
	} else if( $param_name == 'h2_use_theme_fonts' ){
		$params[$i]['std'] = 'yes';
		
	} else if( $param_name == 'h4_use_theme_fonts' ){
		$params[$i]['std'] = 'yes';
		
	}
	$i++;
}

global $tm_sc_params_eventsbox;
$tm_sc_params_eventsbox = $params;


vc_map( array(
	"name"     => esc_attr__("ThemetechMount Events Box", "fixtech"),
	"base"     => "tm-eventsbox",
	"icon"     => "icon-themetechmount-vc",
	'category' => esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ),
	"params"   => $params
) );