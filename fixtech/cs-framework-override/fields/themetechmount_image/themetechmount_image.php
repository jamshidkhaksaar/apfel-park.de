<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.
/**
 *
 * Field: Image
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
class CSFramework_Option_themetechmount_image extends CSFramework_Options {

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

    $preview = '';
    $value   = $this->element_value();
	
	$defaults_value = array(
      'id'        => '',
      'thumb-url' => '',
      'full-url'  => '',
    );
	
	$value           = wp_parse_args( $this->element_value(), $defaults_value );
    $id_value        = ( isset($value['id']) && $value['id']!='' ) ? $value['id'] : '' ;
	$thumb_url_value = ( isset($value['thumb-url']) && $value['thumb-url']!='' ) ? $value['thumb-url'] : '' ;
	$full_url_value  = ( isset($value['full-url']) && $value['full-url']!='' ) ? $value['full-url'] : '' ;
	
	
    $add     = ( ! empty( $this->field['add_title'] ) ) ? esc_attr($this->field['add_title']) : esc_attr__( 'Add Image', 'fixtech' );
    $hidden  = ( empty( $id_value ) && empty($full_url_value) ) ? ' hidden' : '';

	$preview = $thumb_url_value;
    if( ! empty( $id_value ) ) {
      $attachment = wp_get_attachment_image_src( $id_value, 'thumbnail' );
      $preview    = $attachment[0];
    }

    echo '<div class="cs-image-preview'. esc_attr($hidden) .'"><div class="cs-preview"><i class="fa fa-times cs-remove"></i><img src="'. esc_url($preview) .'" alt="' . esc_attr__('Preview','fixtech') . '" /></div></div>';
    echo '<a href="#" class="button button-primary cs-add">'. $add .'</a>';
    echo '<input type="text" name="'. esc_attr($this->element_name('[id]')) .'" value="'. esc_attr($id_value) .'"'. $this->element_class('tm-cs-imgid') . $this->element_attributes() .'/>';
	echo '<input type="text" name="'. esc_attr($this->element_name('[thumb-url]')) .'" value="'. esc_url($thumb_url_value) .'" class="tm-cs-thumburl" />';
	echo '<input type="text" name="'. esc_attr($this->element_name('[full-url]')) .'" value="'. esc_url($full_url_value) .'" class="tm-cs-fullurl" />';

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
