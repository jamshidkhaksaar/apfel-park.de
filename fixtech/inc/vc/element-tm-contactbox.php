<?php

/* Options */

$params = array(
	array(
		"type"        => "textarea",
		"holder"      => "div",
		"class"       => "",
		"heading"     => esc_attr__("Address",'fixtech'),
		"description" => esc_attr__("Write address here. You can write in multi-line too.",'fixtech'),
		"param_name"  => "address",
	),
	array(
		"type"        => "textarea",
		"holder"      => "div",
		"class"       => "",
		"heading"     => esc_attr__("Phone",'fixtech'),
		"description" => esc_attr__("Write phone number here. Example: (+01) 123 456 7890",'fixtech'),
		"param_name"  => "phone",
	),
	array(
		"type"        => "textfield",
		"holder"      => "div",
		"class"       => "",
		"heading"     => esc_attr__("Email",'fixtech'),
		"description" => esc_attr__("Write email here. Example: info@example.com",'fixtech'),
		"param_name"  => "email",
	),
	array(
		"type"        => "textfield",
		"holder"      => "div",
		"class"       => "",
		"heading"     => esc_attr__("Website",'fixtech'),
		"description" => esc_attr__("Write website URL here. Example: http://www.example.com",'fixtech'),
		"param_name"  => "website",
	),
	array(
		"type"        => "textarea",
		"holder"      => "div",
		"class"       => "",
		"heading"     => esc_attr__("Time",'fixtech'),
		"description" => esc_attr__("Write time here. You can write in multi-line too.",'fixtech'),
		"param_name"  => "time",
	),
);

$params    = array_merge( $params, array( vc_map_add_css_animation() ), array( themetechmount_vc_ele_extra_class_option() ), array( themetechmount_vc_ele_css_editor_option() ) );

global $tm_sc_params_contactbox;
$tm_sc_params_contactbox = $params;

vc_map( array(
	"name"     => esc_attr__("ThemetechMount Contact Details Box",'fixtech'),
	"base"     => "tm-contactbox",
	"class"    => "",
	'category' => esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ),
	"icon"     => "icon-themetechmount-vc",
	"params"   => $params
) );