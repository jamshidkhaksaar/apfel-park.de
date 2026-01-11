<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.

include( get_template_directory() .'/cs-framework-override/config/metabox-options.php' );

if( class_exists('CSFramework_Metabox') ){
	CSFramework_Metabox::instance( $tm_metabox_options );
}


