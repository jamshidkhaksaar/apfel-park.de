<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.

if( !isset($tm_framework_settings) || !isset($tm_framework_options) ){
	include( get_template_directory() .'/cs-framework-override/config/framework-options.php' );
}

CSFramework::instance( $tm_framework_settings, $tm_framework_options );
