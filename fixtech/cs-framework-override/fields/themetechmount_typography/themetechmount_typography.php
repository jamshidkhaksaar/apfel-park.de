<?php if ( ! defined( 'ABSPATH' ) ) { die; } // Cannot access pages directly.
/**
 *
 * Field: Typography
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
class CSFramework_Option_themetechmount_typography extends CSFramework_Options {

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

    $defaults_value = array(
      'family'         => 'Arial',
      'variant'        => 'regular',
      'font'           => 'websafe',
	  'backup-family'  => '',
	  'text-transform' => '',
	  'font-size'      => '12',
	  'line-height'    => '14',
	  'letter-spacing' => '0',
	  'color'          => '#000',
	  'all-varients'   => '0',
    );

    $default_variants = apply_filters( 'cs_websafe_fonts_variants', array(
      'regular',
      'italic',
      '700',
      '700italic',
      'inherit'
    ));

    $websafe_fonts = apply_filters( 'cs_websafe_fonts', array(
      'Arial',
      'Arial Black',
      'Comic Sans MS',
      'Impact',
      'Lucida Sans Unicode',
      'Tahoma',
      'Trebuchet MS',
      'Verdana',
      'Courier New',
      'Lucida Console',
      'Georgia, serif',
      'Palatino Linotype',
      'Times New Roman'
    ));
	
	
	/**
	 *  Backup font if Google fonts is not available
	 */
	$backup_fonts = apply_filters( 'cs_backup_fonts', array(
		"Arial, Helvetica, sans-serif",
		"'Arial Black', Gadget, sans-serif",
		"'Bookman Old Style', serif",
		"'Comic Sans MS', cursive",
		"Courier, monospace",
		"Garamond, serif",
		"Georgia, serif",
		"Impact, Charcoal, sans-serif",
		"'Lucida Console', Monaco, monospace",
		"'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
		"'MS Sans Serif', Geneva, sans-serif",
		"'MS Serif', 'New York', sans-serif",
		"'Palatino Linotype', 'Book Antiqua', Palatino, serif",
		"Tahoma, Geneva, sans-serif",
		"'Times New Roman', Times,serif",
		"'Trebuchet MS', Helvetica, sans-serif",
		"Verdana, Geneva, sans-serif",
    ));
	
	/**
	 *  Text Transform
	 */
	$text_transform = apply_filters( 'cs_text_transform', array(
		"none",
		"capitalize",
		"uppercase",
		"lowercase",
		"initial",
		"inherit",
    ));
	
	
	
	

    $value                = wp_parse_args( $this->element_value(), $defaults_value );
    $family_value         = $value['family'];
	$backup_family_value  = $value['backup-family'];
    $variant_value        = $value['variant'];
	$text_transform_value = $value['text-transform'];
	$font_size_value      = $value['font-size'];
	$line_height_value    = $value['line-height'];
    $letter_spacing_value = $value['letter-spacing'];
	$color_value          = $value['color'];
	$all_varients_value   = $value['all-varients'];
	
	$is_variant          = ( isset( $this->field['variant'] ) && $this->field['variant'] === false ) ? false : true;
    $is_chosen           = ( isset( $this->field['chosen'] ) && $this->field['chosen'] === false ) ? '' : 'chosen ';
	$is_backup_family    = ( isset( $this->field['backup-family'] ) && $this->field['backup-family'] === false ) ? false : true;
	$is_text_transform   = ( isset( $this->field['text-transform'] ) && $this->field['text-transform'] === false ) ? false : true;
	$is_font_size        = ( isset( $this->field['font-size'] ) && $this->field['font-size'] === false ) ? false : true;
	$is_line_height      = ( isset( $this->field['line-height'] ) && $this->field['line-height'] === false ) ? false : true;
	$is_letter_spacing   = ( isset( $this->field['letter-spacing'] ) && $this->field['letter-spacing'] === false ) ? false : true;
	$is_color            = ( isset( $this->field['color'] ) && $this->field['color'] === false ) ? false : true;
	$is_all_varients     = ( isset( $this->field['all-varients'] ) && $this->field['all-varients'] === false ) ? false : true;   
	
    $google_json   = themetechmount_cs_get_google_fonts();
    $chosen_rtl    = ( is_rtl() && ! empty( $is_chosen ) ) ? 'chosen-rtl ' : '';
	
	
	
    if( is_object( $google_json ) ) {

      $googlefonts = array();

      foreach ( $google_json->items as $key => $font ) {
        $googlefonts[$font->family] = $font->variants;
      }

      $is_google = ( array_key_exists( $family_value, $googlefonts ) ) ? true : false;

      
	  
	  echo '<div class="cs-tm-typography-row1">';
	  
	  
	  /**
	   *  Font Family
	   */
	  echo '<div class="tm-option-col-6 cs-tm-typography-dropdown-w cs-tm-typography-family-w">';
	  echo '<label class="tm-typography-family">';
	  echo '<small>'.esc_attr__( 'Font Family', 'fixtech' ).'</small><br>';
      echo '<select name="'. $this->element_name( '[family]' ) .'" class="'. $is_chosen . $chosen_rtl .'cs-typo-family" data-atts="family"'. $this->element_attributes() .'>';
      do_action( 'cs_typography_family', $family_value, $this );
      echo '<optgroup label="'. esc_attr__( 'Web Safe Fonts', 'fixtech' ) .'">';
      foreach ( $websafe_fonts as $websafe_value ) {
        echo '<option value="'. $websafe_value .'" data-variants="'. implode( '|', $default_variants ) .'" data-type="websafe"'. selected( $websafe_value, $family_value, true ) .'>'. $websafe_value .'</option>';
      }
      echo '</optgroup>';
      echo '<optgroup label="'. esc_attr__( 'Google Fonts', 'fixtech' ) .'">';
      foreach ( $googlefonts as $google_key => $google_value ) {
        echo '<option value="'. $google_key .'" data-variants="'. implode( '|', $google_value ) .'" data-type="google"'. selected( $google_key, $family_value, true ) .'>'. $google_key .'</option>';
      }
      echo '</optgroup>';
      echo '</select>';
      echo '</label>';
	  echo '</div>';
	  
	  
	  
	  /**
	   *  Backup Font Family
	   */
		if( ! empty( $is_backup_family ) ) {
			echo '<div class="tm-option-col-6 cs-tm-typography-dropdown-w cs-tm-typography-bfont-family-w">';
			echo '<label class="tm-cs-backup-family">';
			echo '<small>'.esc_attr__( 'Backup Font Family', 'fixtech' ).'</small><br>';
			echo '<select name="'. $this->element_name( '[backup-family]' ) .'" class="'. $is_chosen . $chosen_rtl .'cs-typo-backup-font-family" data-atts="backup-family">';
			foreach ( $backup_fonts as $backup_font ) {
				echo '<option value="'. $backup_font .'" '. selected( $backup_font, $backup_family_value, true ) .'>'. $backup_font .'</option>';
			}
			echo '</select>';
			echo '</label>';
			echo '</div>';
		}
	  
	  
	
	  echo '<div class="clear clr"></div> </div> <!-- .cs-tm-typography-row1 -->';
	  echo '<div class="cs-tm-typography-row2">';
	  
	  
	  /**
	   *  Font variants
	   */
      if( ! empty( $is_variant ) ) {
        $variants = ( $is_google ) ? $googlefonts[$family_value] : $default_variants;
        $variants = ( $value['font'] === 'google' || $value['font'] === 'websafe' ) ? $variants : array( 'regular' );
		echo '<div class="tm-option-col-6 cs-tm-typography-dropdown-w cs-tm-typography-weight-w">';
        echo '<label class="cs-typography-variant">';
		echo '<small>'.esc_attr__( 'Font Variants', 'fixtech' ).'</small><br>';
        echo '<select name="'. $this->element_name( '[variant]' ) .'" class="'. $is_chosen . $chosen_rtl .'cs-typo-variant" data-atts="variant">';
        foreach ( $variants as $variant ) {
          echo '<option value="'. $variant .'"'. $this->checked( $variant_value, $variant, 'selected' ) .'>'. $variant .'</option>';
        }
        echo '</select>';
        echo '</label>';
		echo '</div>';
      }
	  
	  
	  
		/**
		 *  Text Transform
		 */
		if( ! empty( $is_text_transform ) ) {
			$variants = ( $is_google ) ? $googlefonts[$family_value] : $default_variants;
			$variants = ( $value['font'] === 'google' || $value['font'] === 'websafe' ) ? $variants : array( 'regular' );
			echo '<div class="tm-option-col-6 cs-tm-typography-dropdown-w cs-tm-typography-transform-w">';
			echo '<label class="cs-typography-text-transform">';
			echo '<small>'.esc_attr__( 'Text Transform', 'fixtech' ).'</small><br>';
			echo '<select name="'. $this->element_name( '[text-transform]' ) .'" class="'. $is_chosen . $chosen_rtl .' cs-typo-text-transform" data-atts="text-transform">';
			foreach ( $text_transform as $text_transform_option ) {
				$text_transform_option_val = $text_transform_option;
				if( $text_transform_option == 'none' ){
					$text_transform_option_val = '';
				}
				echo '<option value="'. $text_transform_option_val .'"'. 
				selected( $text_transform_option_val, $text_transform_value, true )
				 .'>'. ucfirst($text_transform_option) .'</option>';
			}
			echo '</select>';
			echo '</label>';
			echo '</div>';
		}
	  
	   echo '<div class="clear clr"></div>  </div> <!-- .cs-tm-typography-row2 -->';
	  

		
		/**
		 *  Font Size
		 */
		if( ! empty( $is_font_size ) ) {
			echo '<div class="tm-fancy-input-w">';
			echo '<label class="cs-typography-font-Size">';
			echo '<small>'.esc_attr__( 'Font Size', 'fixtech' ).'</small><br>';
			echo '<div class="input-append">
			<input type="number" class="cs-typo-font-size mini" min="1" max="200" step="1" title="'.esc_attr__( 'Font Size', 'fixtech' ).'" name="'. esc_attr($this->element_name( '[font-size]' )) .'" value="'.esc_attr($font_size_value).'">
			<span class="add-on">px</span>
			<div class="clear clr"></div>
			</div><div class="clear clr"></div>';
			echo '</label>';
			echo '</div>';

		}
		
		
		
		
		/**
		 *  Line Height
		 */
		if( ! empty( $is_line_height ) ) {
			echo '<div class="tm-fancy-input-w">';
			echo '<label class="cs-typography-line-height">';
			echo '<small>'.esc_attr__( 'Line Height', 'fixtech' ).'</small><br>';
			echo '<div class="input-append">
			<input type="number" class="cs-typo-line-height mini" min="1" max="200" step="1" title="'.esc_attr__( 'Line Height', 'fixtech' ).'" name="'. esc_attr($this->element_name( '[line-height]' )) .'" value="'.esc_attr($line_height_value).'">
			<span class="add-on">px</span>
			<div class="clear clr"></div>
			</div><div class="clear clr"></div>';
			echo '</label>';
			echo '</div>';

		}
		
		
		
		
		/**
		 *  Letter Spacing
		 */
		if( ! empty( $is_letter_spacing ) ) {
			echo '<div class="tm-fancy-input-w">';
			echo '<label class="cs-typography-line-height">';
			echo '<small>'.esc_attr__( 'Letter Spacing', 'fixtech' ).'</small><br>';
			echo '<div class="input-append">
			<input type="number" class="cs-typo-line-height mini" min="0" max="20" step="0.1" title="'.esc_attr__( 'Letter Spacing', 'fixtech' ).'" name="'. esc_attr($this->element_name( '[letter-spacing]' )) .'" value="'.esc_attr($letter_spacing_value).'">
			<span class="add-on">px</span>
			<div class="clear clr"></div>
			</div><div class="clear clr"></div>';
			echo '</label>';
			echo '</div>';

		}
		
		
		
		
		/**
		 *  Color picker
		 */
		if( ! empty( $is_color ) ) {
			echo '<div class="tm-typography-font-color-w">';
			echo '<label class="tm-typography-font-color">';
			echo '<small>'.esc_attr__( 'Font Color', 'fixtech' ).'</small><br>';
			echo '<input type="text" name="'. esc_attr($this->element_name( '[color]' )) .'" value="'. esc_attr($color_value) .'"'. $this->element_class( 'cs-field-color-picker' ) . '/>';
			echo '</label>';
			echo '</div>';
		}

		



		echo '<div class="clear clr"></div>';
		
		
		
		
		
	  /**
	   *  Load all varients for Google Font (This will be useful for General font as it will set Bold, Italic text)
	   */
      if( ! empty( $is_all_varients ) ) {

        $variants = ( $is_google ) ? $googlefonts[$family_value] : $default_variants;
        $variants = ( $value['font'] === 'google' || $value['font'] === 'websafe' ) ? $variants : array( 'regular' );
		echo '<div class="tm-typography-load-all-varient-w">';
        echo '<label class="cs-typography-font-Size">';
		echo '<div class="tm-typo-all-varient-input"><input type="checkbox" name="'. esc_attr($this->element_name( '[all-varients]' )) .'" value"on" '. checked( 'on', $all_varients_value, false ) .' /></div>';
		echo '<div class="tm-typo-load-all-varient-text">'. esc_attr__('Load all variations of the selected font (Like bold, italic etc.)','fixtech') .'<br><small>'. esc_attr__('Loading all font variations can slow down (a little) your webpage.','fixtech').'</small></div>';
		echo '<div class="clear clr"></div>';
        echo '</label>';
		echo '</div>';
      }
	  
      echo '<input type="text" name="'. esc_attr($this->element_name( '[font]' )) .'" class="cs-typo-font hidden" data-atts="font" value="'. esc_attr($value['font']) .'" />';

	  
    } else {

      echo esc_attr__( 'Error! Can not load json file.', 'fixtech' );

    }

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








/**
 *
 * Get google font from json file
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
if ( ! function_exists( 'themetechmount_cs_get_google_fonts' ) ) {
function themetechmount_cs_get_google_fonts() {

	global $tm_cs_google_fonts;

	if( ! empty( $tm_cs_google_fonts ) ) {

		return $tm_cs_google_fonts;

	} else {

		ob_start();
		cs_locate_template( 'fields/themetechmount_typography/google-fonts.json' );
		$json = ob_get_clean();

		$tm_cs_google_fonts = json_decode( $json );

		return $tm_cs_google_fonts;
	}

}
}