<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.
/**
 *
 * Field: Background
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
class CSFramework_Option_themetechmount_background extends CSFramework_Options {

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
	

    $value_defaults = array(
      'image'       => '',
      'repeat'      => '',
      'position'    => '',
      'attachment'  => '',
	  'size'        => '',
      'color'       => '',
    );

    $this->value    = wp_parse_args( $this->element_value(), $value_defaults );

    $upload_type    = ( isset( $upload_type  ) ) ? $upload_type  : 'image';
    $button_title   = ( isset( $button_title ) ) ? $button_title : esc_attr__( 'Upload', 'fixtech' );
    $frame_title    = ( isset( $frame_title  ) ) ? $frame_title  : esc_attr__( 'Upload', 'fixtech' );
    $insert_title   = ( isset( $insert_title ) ) ? $insert_title : esc_attr__( 'Use Image', 'fixtech' );
	
	
	
	$preview = '';
    $value   = ( isset($this->value['image']) ) ? $this->value['image'] : '' ;
	$valueid = ( isset($this->value['imageid']) ) ? $this->value['imageid'] : '' ;
    $hidden       = ( empty( $value ) )  ? ' hidden' : '';
	$hidden_text  = ( !empty( $value ) ) ? ' hidden' : '';
	
	$btntext_add    = esc_attr__('Add image','fixtech');
	$btntext_change = esc_attr__('Change image','fixtech');
	$btntext        = ( empty( $value ) )  ? esc_attr__('Add image','fixtech') : esc_attr__('Change image','fixtech');
	
	
	
    if( ! empty( $value ) ) {
      $attachment = wp_get_attachment_image_src( $valueid, 'thumbnail' );
      $preview    = $attachment[0];
    }
	
	if( empty($preview) ){
		$preview = $value;
	}
	
	echo '<div class="tm-cs-background-wrapper">';
	
	// Translation ready button text
	echo '<span class="tm-cs-background-text-add-image" style="display:none;">'. esc_attr($btntext_add).'</span>';
	echo '<span class="tm-cs-background-text-change-image" style="display:none;">'.esc_attr($btntext_change).'</span>';
	
	// Image selector wrapper
	echo '<div class="tm-cs-background-image-picker">';
	
	echo '<div class="tm-cs-background-image-picker-inner">';
	
	echo '<div class="cs-image-preview"><div class="cs-preview"><div class="cs-preview-inner">
			<i class="fa fa-times cs-remove tm-cs-remove'. esc_attr($hidden) .'"></i>
			<img src="'. esc_attr($preview) .'" alt="' . esc_attr__('preview','fixtech') . '" class="'. esc_attr($hidden) .'" />
			<div class="tm-cs-background-heading-noimg'. esc_attr($hidden_text) .'"> ' . esc_attr__('No image selected for background','fixtech') . ' </div>
		</div></div></div>';
	
    echo '<a href="javascript:void(0)" class="button button-primary cs-add">'. esc_attr($btntext) .'</a>';
    echo '<input type="text" name="'. esc_attr($this->element_name('[image]')) .'" value="'. esc_url($this->value['image']) .'"'. $this->element_class('tm-background-image') . $this->element_attributes() .'/>';
	echo '<input type="text" name="'. esc_attr($this->element_name('[imageid]')) .'" value="'. esc_attr($valueid) .'" class="tm-background-imageid"/>';
	
	echo '</div> <!-- .tm-cs-background-image-picker-inner --> ';
	
	echo '</div> <!-- .tm-cs-background-image-picker --> ';
	
    // background attributes
    echo '<fieldset>';
	
	echo '<div class="tm-cs-background-options-wrapper-top">';
	
	echo '<div class="tm-background-option">';
	echo '<label class="tm-background-repeat">';
	echo '<small>'. esc_attr__('BG image repeat','fixtech') .'</small>';
    echo cs_add_element( array(
        'pseudo'          => true,
        'type'            => 'select',
        'name'            => esc_attr($this->element_name( '[repeat]' )),
        'options'         => array(
          ''              => 'repeat',
          'repeat-x'      => 'repeat-x',
          'repeat-y'      => 'repeat-y',
          'no-repeat'     => 'no-repeat',
          'inherit'       => 'inherit',
        ),
        'attributes'      => array(
          'data-atts'     => 'repeat',
        ),
        'value'           => esc_attr($this->value['repeat'])
    ) );
	echo '</label>';
	echo '</div>';
	
	
	echo '<div class="tm-background-option">';
	echo '<label class="tm-background-position">';
	echo '<small>'. esc_attr__('BG image position','fixtech') .'</small>';
    echo cs_add_element( array(
        'pseudo'          => true,
        'type'            => 'select',
        'name'            => esc_attr($this->element_name( '[position]' )),
        'options'         => array(
          ''              => 'left top',
          'left center'   => 'left center',
          'left bottom'   => 'left bottom',
          'right top'     => 'right top',
          'right center'  => 'right center',
          'right bottom'  => 'right bottom',
          'center top'    => 'center top',
          'center center' => 'center center',
          'center bottom' => 'center bottom'
        ),
        'attributes'      => array(
          'data-atts'     => 'position',
        ),
        'value'           => esc_attr($this->value['position'])
    ) );
	echo '</label>';
	echo '</div>';
	
	
    echo '<div class="tm-background-option">';
	echo '<label class="tm-background-attachment">';
	echo '<small>'. esc_attr__('BG image attachment','fixtech') .'</small>';
    echo cs_add_element( array(
        'pseudo'          => true,
        'type'            => 'select',
        'name'            => esc_attr($this->element_name( '[attachment]' )),
        'options'         => array(
          ''              => 'scroll',
          'fixed'         => 'fixed',
        ),
        'attributes'      => array(
          'data-atts'     => 'attachment',
        ),
        'value'           => esc_attr($this->value['attachment'])
    ) );
	echo '</label>';
	echo '</div>';
	
	
	echo ' <div class="clr clear"></div> ';
	echo '</div> <!-- .tm-cs-background-options-wrapper-top --> ';
	
	echo '<div class="tm-cs-background-options-wrapper-bottom">';
	
	
	echo '<div class="tm-background-option">';
	echo '<label class="tm-background-size">';
	echo '<small>'. esc_attr__('BG image size','fixtech') .'</small>';
    echo cs_add_element( array(
        'pseudo'          => true,
        'type'            => 'select',
        'name'            => esc_attr($this->element_name( '[size]' )),
        'options'         => array(
		  ''                => 'Auto',
          'cover'           => 'Cover',
          'fixed'           => 'Contain',
        ),
        'attributes'      => array(
          'data-atts'     => 'size',
        ),
        'value'           => esc_attr($this->value['size'])
    ) );
	echo '</label>';
	echo '</div>';
	
	
	
	
	if( isset($this->field['color']) && $this->field['color']==false ){
		// Do nothing
	} else {
		echo '<div class="tm-background-option tm-background-color-w">';
		echo '<label class="tm-background-color">';
		echo '<small>'. esc_attr__('BG image color','fixtech') .'</small>';
		echo cs_add_element( array(
			'pseudo'          => true,
			'id'              => esc_attr($this->field['id'].'_color'),
			'type'            => 'color_picker',
			'name'            => esc_attr($this->element_name('[color]')),
			'attributes'      => array(
			  'data-atts'     => 'bgcolor',
			),
			'value'           => esc_attr($this->value['color']),
			'default'         => ( isset( $this->field['default']['color'] ) ) ? $this->field['default']['color'] : '',
			'rgba'            => ( isset( $this->field['rgba'] ) && $this->field['rgba'] === false ) ? false : '',
		) );
		echo '</label>';
		echo '</div>';
	};
	
	
	
	
	
	
	
	
				echo '<div class="clear clr"></div> <!-- clear --> ';
			echo '</div> <!-- .tm-cs-background-options-wrapper-bottom --> ';
		echo '</fieldset>';
		echo '<div class="clear clr"></div> <!-- clear --> ';
	echo '</div> <!-- .tm-cs-background-wrapper --> ';
	
	
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
