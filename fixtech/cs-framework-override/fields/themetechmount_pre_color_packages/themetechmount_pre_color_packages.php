<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.
/**
 *
 * Field: Color Picker
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
class CSFramework_Option_themetechmount_pre_color_packages extends CSFramework_Options {

  public function __construct( $field, $value = '', $unique = '' ) {
    parent::__construct( $field, $value, $unique );
  }

  public function output() {

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
	echo esc_attr__('Pre color packages', 'fixtech');
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

  public function extra_attributes() {

    $atts = array();

    if( isset( $this->field['id'] ) ) {
      $atts['data-depend-id'] = $this->field['id'];
    }

    if ( isset( $this->field['rgba'] ) &&  $this->field['rgba'] === false ) {
      $atts['data-rgba'] = 'false';
    }

    if( isset( $this->field['default'] ) ) {
      $atts['data-default-color'] = $this->field['default'];
    }

    return $atts;

  }

}
