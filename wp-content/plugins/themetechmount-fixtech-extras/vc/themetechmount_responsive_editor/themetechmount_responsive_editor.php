<?php

function themetechmount_responsive_editor_field( $settings, $value ) {
	
	
	if ( is_array( $value ) ) {
		//$value = isset( $value['value'] ) ? $value['value'] : array_shift( $value );
	}
	
	if( !empty($value) ){
		$value_array = explode('|',$value);
	}
	
	// random number for class
	$unique_class = rand( 1000, 9999 ) . rand( 1000, 9999 ) ;
	
	// Default values for each elements
	$values = array(
		$unique_class, // random class
		
		'', // Column break in 1200  size
		'', // Large - Margin top
		'', // Large - Margin right
		'', // Large - Margin bottom
		'', // Large - Margin left
		'', // Large - Padding top
		'', // Large - Padding right
		'', // Large - Padding bottom
		'', // Large - Padding left
		
		'', // Column break in 991 screen size
		'', // Medium - Margin top
		'', // Medium - Margin right
		'', // Medium - Margin bottom
		'', // Medium - Margin left
		'', // Medium - Padding top
		'', // Medium - Padding right
		'', // Medium - Padding bottom
		'', // Medium - Padding left
		
		'', // Column break in 767 screen size
		'', // Small - Margin top
		'', // Small - Margin right
		'', // Small - Margin bottom
		'', // Small - Margin left
		'', // Small - Padding top
		'', // Small - Padding right
		'', // Small - Padding bottom
		'', // Small - Padding left
		
		'', // Column break in custom screen size
		'', // Custom - Responsive size
		'', // Custom - Margin top
		'', // Custom - Margin right
		'', // Custom - Margin bottom
		'', // Custom - Margin left
		'', // Custom - Padding top
		'', // Custom - Padding right
		'', // Custom - Padding bottom
		'', // Custom - Padding left
		
	);
		
	if( is_array($value_array) ){
		$values = array_merge( $value_array, $values );
	}

	$responsive_sizes = array(
		'1200' => array(
			'dashicons-laptop', // icon class
			esc_attr('Large', 'fixtech'), // name
		),
		'991' => array(
			'dashicons-tablet', // icon class
			esc_attr('Medium', 'fixtech'), // name
		),
		'767' => array(
			'dashicons-smartphone', // icon class
			esc_attr('Small', 'fixtech'), // name
		),
		'custom' => array(
			'dashicons-editor-code', // icon class
			esc_attr('Custom', 'fixtech'), // name
		),
		
	);
	
	
	// Tabs
	$tab_html     = '<div class="tm-responsive-editor-tab-w"><ul>';
	$options_html = '<div class="tm-responsive-editor-options-w">';
	$options_html .= '<div style="display:none;"><input type="text" name="tm-responsive-editor-class" value="' . $values[0] . '" /></div>';
	
	$x = 1;
	$val_num = 1;
	foreach($responsive_sizes as $size=>$val){
		
		$tab_active    = ( $x=='1' ) ? 'tm-responsive-editor-tab-active' : '' ;
		$option_active = ( $x=='1' ) ? 'tm-responsive-editor-option-active' : '' ;
		
		$tab_html .= '<li class="'.$tab_active.'"> <a href="#" data-tm-size="'.$size.'"> <i class="dashicons-before '.$val[0].'"></i> '.$val[1].' </a> </li>';
		
		$option_heading = '<h4> '.$val[1].' ( <code>max-width:'.$size.'px</code> )</h4>';
		
		// Break Column in this responsive mode
		$checked = '';
		if( $size=='custom' ){
			if( !empty($values[$val_num+1]) && $values[$val_num+1]=='colbreak_yes' ){
				$checked = 'checked';
			}
		} else {
			if( !empty($values[$val_num]) && $values[$val_num]=='colbreak_yes' ){
				$checked = 'checked';
			}
		}
		
		if( !empty($settings['break_column_option']) && $settings['break_column_option']=='no' ){
			$option_break_column = '<div class="tm-responsive-editor-colbreak-w" style="display:none;"><label><input type="checkbox" value="colbreak_yes" name="' . $settings['param_name'] . '_'.$size.'_break_col" '.esc_attr($checked).' /> ' . esc_attr__('Break Column in this (and below) screen size.','fixtech').'</label></div>';
		} else {
			$option_break_column = '<div class="tm-responsive-editor-colbreak-w"><label><input type="checkbox" value="colbreak_yes" name="' . $settings['param_name'] . '_'.$size.'_break_col" '.esc_attr($checked).' /> ' . esc_attr__('Break Column in this (and below) screen size.','fixtech').'</label></div>';
		}
		
		
		$custom_input = '';
		if( $size=='custom' ){
			$option_heading = '
				<div class="tm-responsive-editor-head-custom-w">
					<h4 class="tm-responsive-editor-head-custom"> '.$val[1].' Responsive Screen size:</h4>
					<input type="text" name="' . $settings['param_name'] . '_'.$size.'_margin_top" data-name="margin-top" class="vc_top" placeholder="" data-attribute="margin" value="' . $values[$val_num] . '">
					<small>Example input: <code>650px</code> </small>
					<div class="clear clr"></div>
					<p>This is for custom responsive point where you like to change padding/margin for specific screen size.</p>
				</div>
			';
			$custom_input = '';
			$val_num = $val_num+1;
		}
		
		$options_html .= '
			<div class="themetechmount-responsive-editor '.$option_active.' themetechmount-responsive-editor-'.$size.'">
				'.$option_heading.'
				'.$option_break_column.'
				'.$custom_input.'
				<div class="vc_css-editor vc_row vc_ui-flex-row">
					<div class="vc_layout-onion vc_col-xs-7">
						<div class="vc_margin">
							<label>margin</label>
							<input type="text" name="' . $settings['param_name'] . '_'.$size.'_margin_top" data-name="margin-top" class="vc_top" placeholder="-" data-attribute="margin" value="' . $values[$val_num+1] . '">
							<input type="text" name="' . $settings['param_name'] . '_'.$size.'_margin_right" data-name="margin-right" class="vc_right" placeholder="-" data-attribute="margin" value="' . $values[$val_num+2] . '">
							<input type="text" name="' . $settings['param_name'] . '_'.$size.'_margin_bottom" data-name="margin-bottom" class="vc_bottom" placeholder="-" data-attribute="margin" value="' . $values[$val_num+3] . '">
							<input type="text" name="' . $settings['param_name'] . '_'.$size.'_margin_left" data-name="margin-left" class="vc_left" placeholder="-" data-attribute="margin" value="' . $values[$val_num+4] . '">      
							<div class="vc_border">
								
								<div class="vc_padding">
									<label>padding</label>
									<input type="text" name="tm_responsiveeditor_'.$size.'_padding_top" data-name="padding-top" class="vc_top" placeholder="-" data-attribute="padding" value="' . $values[$val_num+5] . '">
									<input type="text" name="tm_responsiveeditor_'.$size.'_padding_right" data-name="padding-right" class="vc_right" placeholder="-" data-attribute="padding" value="' . $values[$val_num+6] . '">
									<input type="text" name="tm_responsiveeditor_'.$size.'_padding_bottom" data-name="padding-bottom" class="vc_bottom" placeholder="-" data-attribute="padding" value="' . $values[$val_num+7] . '">
									<input type="text" name="tm_responsiveeditor_'.$size.'_padding_left" data-name="padding-left" class="vc_left" placeholder="-" data-attribute="padding" value="' . $values[$val_num+8] . '">
									
									<div class="vc_content">

									</div>
									
								</div>
								
							</div>
							
						</div>
					</div>
				</div>
			</div>
		';
		$x++;
		$val_num = $val_num+9; 
	}
	
	$tab_html     .= '</ul></div>';
	$options_html .= '</div>';
	
	$options_html .= '<input type="hidden" name="' . esc_attr($settings['param_name']) . '" class="tm-main-value-input wpb_vc_param_value wpb-textinput  themetechmount-iconpicker-input ' . esc_attr( $settings['param_name'] ) . ' ' . esc_attr( $settings['type'] ) . '_field" placeholder="-" data-attribute="margin" value="' . esc_attr($value) . '">';
	
	return '<div class="themetechmount-responsive-editor-w">' . $tab_html . $options_html . '</div>';
}
vc_add_shortcode_param( 'themetechmount_responsive_editor', 'themetechmount_responsive_editor_field', TMTE_URI . '/vc/themetechmount_responsive_editor/themetechmount_responsive_editor.js');