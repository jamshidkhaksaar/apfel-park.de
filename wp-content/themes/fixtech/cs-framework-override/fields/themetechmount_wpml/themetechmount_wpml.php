<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.
/**
 *
 * Field: Padding
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
class CSFramework_Option_themetechmount_wpml extends CSFramework_Options {

  public function __construct( $field, $value = '', $unique = '' ) {
    parent::__construct( $field, $value, $unique );
  }

  public function output(){

    echo wp_kses( $this->element_before(),
		array(
			'div' => array(
				'class' => array(),
				'id'    => array(),
			),
			'a' => array(
				'href'  => array(),
				'title' => array(),
				'class' => array()
			),
			'br'     => array(),
			'em'     => array(),
			'strong' => array(),
			'span'   => array(
				'class'  => array(),
			),
			'ol'     => array(),
			'ul'     => array(
				'class'  => array(),
			),
			'li'     => array(
				'class'  => array(),
			),
		)
	);

	
	/* This code is provided by WPML team directly */
	/* Code copied from wpml.org/documentation/support/embedded-installer-authors/?utm_source=WPML+Compatibility+Authors&utm_campaign=cbb44f5ec2-embedded-installer-accepted-by-envato-05-12-2016&utm_medium=email&utm_term=0_b2a62c2269-cbb44f5ec2-85416389 */
	$config['template']			= 'compact'; //required
	$config['product_name']		= 'WPML';
	$config['box_title']		= esc_attr__( 'Multilingual Fixtech Theme', 'fixtech' );
	$config['name']				= esc_attr( 'Fixtech' ); //name of theme/plugin
	$config['box_description']	= esc_attr__('Fixtech theme is fully compatible with WPML - the WordPress Multilingual plugin. WPML lets you add languages to your existing sites and includes advanced translation management.', 'fixtech' );
	$config['repository']		= 'wpml'; // required
	$config['package']			= 'multilingual-cms'; // required
	$config['product']			= 'multilingual-cms'; // required
    WP_Installer_Show_Products($config);
	
	
	
	
	
	
	
    echo wp_kses( $this->element_after(),
		array(
			'div' => array(
				'class' => array(),
				'id'    => array(),
			),
			'a' => array(
				'href'  => array(),
				'title' => array(),
				'class' => array()
			),
			'br'     => array(),
			'em'     => array(),
			'strong' => array(),
			'span'   => array(
				'class'  => array(),
			),
			'ol'     => array(),
			'ul'     => array(
				'class'  => array(),
			),
			'li'     => array(
				'class'  => array(),
			),
		)
	);

  }

}