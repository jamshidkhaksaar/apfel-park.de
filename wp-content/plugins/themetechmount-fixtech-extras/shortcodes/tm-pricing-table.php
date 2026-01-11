<?php
if ( ! defined( 'ABSPATH' ) ) {
	die( '-1' );
}

// [tm-pricing-table]
if( !function_exists('themetechmount_sc_pricing_table') ){
function themetechmount_sc_pricing_table( $atts, $content=NULL ) {

	$return = '';
	
	if( function_exists('vc_map') ){

		
		global $tm_sc_params_pricingtable;
		$list_values   = themetechmount_create_options_list($tm_sc_params_pricingtable);
		
		global $tm_global_ptbox_element_values;
		$tm_global_ptbox_element_values = array();
		
		extract( shortcode_atts( 
			$list_values
		, $atts ) );
		
		$return = '';
		
		$css_class = 'themetechmount-ptables-w wpb_content_element';
		
		// CSS Options class
		if( function_exists('tm_vc_shortcode_custom_css_class') ){
			$custom_css_class = tm_vc_shortcode_custom_css_class($css);
			if( !empty($custom_css_class) ){
				$css_class .= ' ' . $custom_css_class;
			}
		}
		
		// extra Class
		if( !empty($el_class) ){
			$css_class .= ' ' . $el_class;
		}
		
		
		/* *********************************************************************** */
		/* ************************** Generating Output ************************** */
		
		$return .= '<div class="' . esc_attr( $css_class ) . '">';
		
		$columns_data = array();
		foreach( $list_values as $option_key=>$option_val ){
			
			// First Column
			if( substr($option_key, 0,5)=='col1_' ){
				$columns_data['1_col'][$option_key] = ${$option_key};
			}
			
			// Second Column
			if( substr($option_key, 0,5)=='col2_' ){
				$columns_data['2_col'][$option_key] = ${$option_key};
			}
			
			// Third Column
			if( substr($option_key, 0,5)=='col3_' ){
				$columns_data['3_col'][$option_key] = ${$option_key};
			}
			
			// Fourth Column
			if( substr($option_key, 0,5)=='col4_' ){
				$columns_data['4_col'][$option_key] = ${$option_key};
			}
			
			// Fifth Column
			if( substr($option_key, 0,5)=='col5_' ){
				$columns_data['5_col'][$option_key] = ${$option_key};
			}
			
		}
		
		// Removing column if title is blank
		if( empty($columns_data['1_col']['col1_heading']) ){  unset($columns_data['1_col']); }
		if( empty($columns_data['2_col']['col2_heading']) ){  unset($columns_data['2_col']); }
		if( empty($columns_data['3_col']['col3_heading']) ){  unset($columns_data['3_col']); }
		if( empty($columns_data['4_col']['col4_heading']) ){  unset($columns_data['4_col']); }
		if( empty($columns_data['5_col']['col5_heading']) ){  unset($columns_data['5_col']); }
		
		
		
		// Pricing table column class
		$table_col_class = '';
		if( $boxstyle!='horizontal' ){
			switch( count($columns_data) ){
				case '1':
					$table_col_class = 'col-md-12';
					break;
					
				case '2':
				default:
					$table_col_class = 'col-md-6';
					break;
					
				case '3':
					$table_col_class = 'col-md-4';
					break;
					
				case '4':
					$table_col_class = 'col-md-3';
					break;
					
				case '5':
					$table_col_class = 'col-md-2';
					break;
			}
		}
		
		$col = 1;
		foreach( $columns_data as $column_data ){
			
			// Featured column
			$featured_class     = '';
			if( !empty($featured_col) && $col==$featured_col ){
				$featured_class = 'tm-ptablebox-featured-col';
			}
			
			
			// Featured column
			$currency_class     = '';
			if( isset($column_data['col' . $col . '_cur_symbol_position']) && $column_data['col' . $col . '_cur_symbol_position']=='before' ){
				$currency_class = 'tm-currency-before';
			}
			else {
				$currency_class = 'tm-currency-after';
			}
			
			/** Icon **/
			$icon = '';
			
			
			// This is real icon code
			$icon_type = ${'col'.$col.'_i_type'};
			$icon_class = ( !empty( ${'col'.$col.'_i_icon_'.$icon_type } ) ) ? ${'col'.$col.'_i_icon_'.$icon_type} : '' ;
			$icon_html  = '<div class="tm-sbox-icon-wrapper"><i class="' . $icon_class . '"></i></div>';
			
			// each line
			$lines_html = '';
			$values     = ${'col'.$col.'_values' };
			$values     = (array) vc_param_group_parse_atts( $values );
			
			
			
			if( is_array($values) && count($values)>0 ){
				
				foreach ( $values as $data ) {
					
					$new_line = $data;

					$lines_html .= isset( $data['label'] ) ? '<li>'.$data['label'].'</li>' : '';
				}
				
			}
			
			if( !empty($lines_html) ){
				$lines_html = '<ul class="tm-feature-lines">'.$lines_html.'</ul>';
			}
			
			
			$return .= '<div class="ttm-pricetable-column-w ' . esc_attr($featured_class) . ' ">';
			$return .= '<div class="ttm-pricetable-column-inner ' . esc_attr($currency_class) . '">';	
			
			if( !empty($featured_col) && $col==$featured_col && !empty($feature_column_title) ){
				$return .= '<div class="ttm-featured-title">' . rawurldecode(base64_decode(trim($feature_column_title))) . '</div>';
			}
			
					$tm_global_ptbox_element_values = array();
					// storing in global varibales to be used in template file
					$tm_global_ptbox_element_values['boxstyle']			= $boxstyle;
					$tm_global_ptbox_element_values['icon_html']		= $icon_html;
					$tm_global_ptbox_element_values['lines_html']		= $lines_html;
					$tm_global_ptbox_element_values['heading']			= $column_data['col' . $col . '_heading'];
					$tm_global_ptbox_element_values['description']			= $column_data['col' . $col . '_description'];
					$tm_global_ptbox_element_values['price']			= $column_data['col' . $col . '_price'];
					$tm_global_ptbox_element_values['cur_symbol']		=  $column_data['col' . $col . '_cur_symbol'];
					$tm_global_ptbox_element_values['cur_symbol_before']	=  '';
					$tm_global_ptbox_element_values['cur_symbol_after']		=  '';
					if( isset($column_data['col' . $col . '_cur_symbol_position']) && $column_data['col' . $col . '_cur_symbol_position']=='before' ){
						$tm_global_ptbox_element_values['cur_symbol_before']	=  '<div class="tm-ptablebox-cur-symbol-before">'.$column_data['col' . $col . '_cur_symbol'].'</div>';
					} else {
						$tm_global_ptbox_element_values['cur_symbol_after']		=  '<div class="tm-ptablebox-cur-symbol-after">'.$column_data['col' . $col . '_cur_symbol'].'</div>';
					}
					$tm_global_ptbox_element_values['price_frequency']	= $column_data['col' . $col . '_price_frequency'];
					$tm_global_ptbox_element_values['btn_title']		= $column_data['col' . $col . '_btn_title'];
					$tm_global_ptbox_element_values['btn_link']			= $column_data['col' . $col . '_btn_link'];
					$tm_global_ptbox_element_values['main-class']		= ''; // Extra field
					
					
					
					ob_start();
					
	
					get_template_part('template-parts/pricetable/pricetable', $boxstyle);
					$return .= ob_get_contents();
					ob_end_clean();
					
					
				$return .= '</div>';
			$return .= '</div>';
			
			$col++;
		}
		
		$return .= '</div>';
		
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
	
	return $return;
	
}
}
add_shortcode( 'tm-pricing-table', 'themetechmount_sc_pricing_table' );