<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.
/**
 *
 * Field: Padding
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
class CSFramework_Option_themetechmount_dimensions extends CSFramework_Options {

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

    $value        = $this->element_value();
    $value_height = ( isset( $value['height'] ) ) ? $value['height'] : '';
    $value_width  = ( isset( $value['width'] ) ) ? $value['width'] : '';
    $value_crop   = ( isset( $value['crop'] ) ) ? $value['crop'] : 'yes';
	$value_crop_yes = ( $value_crop=='yes' ) ? ' checked="checked" ' : '' ;
    $value_crop_no  = ( $value_crop=='no'  ) ? ' checked="checked" ' : '' ;
	echo '<div class="tm-dimensions-wrapper">';
	
	
	/**
	 * Width
	 * */
	echo '<div class="tm-dimensions-width field-dimensions-input input-prepend input-append">';
	echo '<span class="add-on add-on-left"><i class="cs-icon fa fa-arrows-h"></i></span>';
	echo '<input placeholder="'. esc_attr__('Width', 'fixtech') .'" type="'. $this->element_type() .'" name="'. $this->element_name( '[width]' ) .'" value="'. $value_width .'"'. $this->element_class('mini') . $this->element_attributes() .'/>';
	echo '<span class="add-on add-on-right"> px</span>';
	echo '</div>';
	
	
	/**
	 * Height
	 * */
	echo '<div class="tm-dimensions-height field-dimensions-input input-prepend input-append">';
	echo '<span class="add-on add-on-left"><i class="cs-icon fa fa-arrows-v"></i></span>';
	echo '<input placeholder="'. esc_attr__('Height', 'fixtech') .'" type="'. $this->element_type() .'" name="'. $this->element_name( '[height]' ) .'" value="'. $value_height .'"'. $this->element_class('mini') . $this->element_attributes() .'/>';
	echo '<span class="add-on add-on-right"> px</span>';
	echo '</div>';

	
	/**
	 * Hard Crop
	 * */
	echo '<div class="field-tm-dimensions-input tm-hard-crop-wrapper">';
	echo '
		<strong>' . esc_attr__( 'Hard Crop Image?', 'fixtech' ) . '</strong>
		 &nbsp; 
		<label class="radio inline">
		
			<input type="radio" name="'. esc_attr($this->element_name( '[crop]' )) .'" value="yes"'. $this->element_attributes() . ' '.$value_crop_yes.' />
		
			'.esc_attr__('YES','fixtech').'
		</label>
		 &nbsp; 
		<label class="radio inline">
		
			<input type="radio" name="'. esc_attr($this->element_name( '[crop]' )) .'" value="no"'. $this->element_attributes() . ' '.$value_crop_no.'/>
		
			'.esc_attr__('NO','fixtech').'
		</label>
		
	';
	echo '</div>';
	
	echo '<div class="clear clr"></div>';
	
	echo '</div><!-- .tm-dimensions-wrapper -->';
	
	
	
	
	
	
	
	
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