<?php

/* Options */

$allParams = array(
		array(
			"type"			=> "textfield",
			"holder"		=> "div",
			"class"			=> "",
			"heading"		=> esc_attr__("Twitter handle (Twitter Username)",'fixtech'),
			"param_name"	=> "username",
			"description"	=> esc_attr__('Twitter user name. Example "envato".','fixtech')
		),
		array(
			"type"			=> "textfield",
			"holder"		=> "div",
			"class"			=> "",
			"heading"		=> esc_attr__('"Follow us" text after big icon','fixtech'),
			"param_name"	=> "followustext",
			"description"	=> esc_attr__('(optional) Follow us text after the big Twitter icon so user can click on it and go to Twitter profile page.','fixtech')
		),
		array(
			"type"			=> "dropdown",
			"holder"		=> "div",
			"class"			=> "",
			"heading"		=> esc_attr__("Show Tweets",'fixtech'),
			"param_name"	=> "show",
			"description"	=> esc_attr__('How many Tweets you like to show.','fixtech'),
			'value' => array(
				esc_attr__( '1', 'fixtech' ) => '1',
				esc_attr__( '2', 'fixtech' ) => '2',
				esc_attr__( '3', 'fixtech' ) => '3',
				esc_attr__( '4', 'fixtech' ) => '4',
				esc_attr__( '5', 'fixtech' ) => '5',
				esc_attr__( '6', 'fixtech' ) => '6',
				esc_attr__( '7', 'fixtech' ) => '7',
				esc_attr__( '8', 'fixtech' ) => '8',
				esc_attr__( '9', 'fixtech' ) => '9',
				esc_attr__( '10', 'fixtech' ) => '10',
			),
			'std' => '3',
		),
		
	);

$boxParams  = themetechmount_box_params();
$css_editor = array( themetechmount_vc_ele_css_editor_option() );

$params = array_merge( $allParams, $boxParams, $css_editor );



// Changing default values
$i = 0;
foreach( $params as $param ){
	
	$param_name = (isset($param['param_name'])) ? $param['param_name'] : '' ;
	
	if( $param_name == 'column' ){
		$params[$i]['std'] = 'one';
	
	} else if( $param_name == 'view' ){
		$params[$i]['std'] = 'carousel';
		
	} else if( $param_name == 'carousel_dots' ){
		$params[$i]['std'] = 'true';
		
	} else if( $param_name == 'carousel_nav' ){ // Removing "About Carousel" option as it's not used here.
		unset( $params[$i]['value']["Above Carousel"] );
		
	}
	
	$i++;
}

global $tm_sc_params_twitterbox;
$tm_sc_params_twitterbox = $params;

vc_map( array(
	"name"        => esc_attr__("ThemetechMount Twitter Box",'fixtech'),
	"base"        => "tm-twitterbox",
	"class"       => "",
	'category' => esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ),
	"icon"        => "icon-themetechmount-vc",
	"params"      => $params,
) );