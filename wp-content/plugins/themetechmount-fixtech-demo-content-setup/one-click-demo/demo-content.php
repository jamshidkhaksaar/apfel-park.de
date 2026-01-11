<?php


/******************* Helper Functions ************************/

/**
 *
 * Encode string for backup options
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
if ( ! function_exists( 'cs_encode_string' ) ) {
	function cs_encode_string( $string ) {
		return rtrim( strtr( call_user_func( 'base'. '64' .'_encode', addslashes( gzcompress( serialize( $string ), 9 ) ) ), '+/', '-_' ), '=' );
	}
}

/**
 *
 * Decode string for backup options
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 */
if ( ! function_exists( 'cs_decode_string' ) ) {
	function cs_decode_string( $string ) {
		return unserialize( gzuncompress( stripslashes( call_user_func( 'base'. '64' .'_decode', rtrim( strtr( $string, '-_', '+/' ), '=' ) ) ) ) );
	}
}



/*************** Demo Content Settings *******************/
function themetechmount_action_rss2_head(){
	// Get theme configuration
	$sidebars = get_option('sidebars_widgets');
	// Get Widgests configuration
	$sidebars_config = array();
	foreach ($sidebars as $sidebar => $widget) {
		if ($widget && is_array($widget)) {
			foreach ($widget as $name) {
				$name = preg_replace('/-\d+$/','',$name);
				$sidebars_config[$name] = get_option('widget_'.$name);
			}
		}
	}
	
	// Get Menus
	$locations = get_nav_menu_locations();
	$menus     = wp_get_nav_menus();
	$menuList  = array();
	foreach( $locations as $location => $menuid ){
		if( $menuid!=0 && $menuid!='' && $menuid!=false ){
			if( is_array($menus) && count($menus)>0 ){
				foreach( $menus as $menu ){
					if( $menu->term_id == $menuid ){
						$menuList[$location] = $menu->name;
					}
				}
			}
		}
	}
	
	$config = array(
			'page_for_posts'   => get_the_title( get_option('page_for_posts') ),
			'show_on_front'    => get_option('show_on_front'),
			'page_on_front'    => get_the_title( get_option('page_on_front') ),
			'posts_per_page'   => get_option('posts_per_page'),
			'sidebars_widgets' => $sidebars,
			'sidebars_config'  => $sidebars_config,
			'menu_list'        => $menuList,
		);            
	if ( defined('THEMETECHMOUNT_THEME_DEVELOPMENT') ) {
		echo sprintf('<wp:theme_custom>%s</wp:theme_custom>', base64_encode(serialize($config)));
	}
}

if ( defined('THEMETECHMOUNT_THEME_DEVELOPMENT') ) {
	add_action('rss2_head', 'themetechmount_action_rss2_head');
}

/**********************************************************/




/********************* Ajax Callback Init **************************/
add_action( 'admin_footer', 'themetechmount_one_click_js_code' );
function themetechmount_one_click_js_code() {
	$images   = array();
	$images[] = get_template_directory_uri() . '/cs-framework-override/fields/themetechmount_one_click_demo_content/import-alert.jpg';
	$images[] = get_template_directory_uri() . '/cs-framework-override/fields/themetechmount_one_click_demo_content/import-loader.gif';
	$images[] = get_template_directory_uri() . '/cs-framework-override/fields/themetechmount_one_click_demo_content/import-success.jpg';
	
	?>
	<script type="text/javascript" >
	jQuery(document).ready(function($) {
		
		/*********** Preload images **************/
		function preload(arrayOfImages) {
			$(arrayOfImages).each(function(){
				$('<img/>')[0].src = this;
			});
		}
		preload([
			<?php
			$total = count($images);
			$x     = 1;
			foreach( $images as $image ){
				echo '"'. $image . '"' ;
				if( $total != $x ){
					echo ',';
				}
				$x++;
			}
			?>
		]);
		/*****************************************/
		
	});
	</script>
	<?php
}




if( !class_exists( 'themetechmount_fixtech_one_click_demo_setup' ) ) {
	

	class themetechmount_fixtech_one_click_demo_setup{
		
		
		function __construct(){
			add_action( 'wp_ajax_fixtech_install_demo_data', array( &$this , 'ajax_install_demo_data' ) );
		}
		
		
		/**
		 * Decide if the given meta key maps to information we will want to import
		 *
		 * @param string $key The meta key to check
		 * @return string|bool The key if we do want to import, false if not
		 */
		function is_valid_meta_key( $key ) {
			// skip attachment metadata since we'll regenerate it from scratch
			// skip _edit_lock as not relevant for import
			if ( in_array( $key, array( '_wp_attached_file', '_wp_attachment_metadata', '_edit_lock' ) ) )
				return false;
			return $key;
		}
		
		
		
		
		/**
		 * Added to http_request_timeout filter to force timeout at 60 seconds during import
		 * @return int 60
		 */
		function bump_request_timeout() {
			return 600;
		}
		
		
		
		/**
		 * Map old author logins to local user IDs based on decisions made
		 * in import options form. Can map to an existing user, create a new user
		 * or falls back to the current user in case of error with either of the previous
		 */
		function get_author_mapping() {
			
			if ( ! isset( $_POST['imported_authors'] ) )
				return;

			$create_users = $this->allow_create_users();

			foreach ( (array) $_POST['imported_authors'] as $i => $old_login ) {
				// Multisite adds strtolower to sanitize_user. Need to sanitize here to stop breakage in process_posts.
				$santized_old_login = sanitize_user( $old_login, true );
				$old_id = isset( $this->authors[$old_login]['author_id'] ) ? intval($this->authors[$old_login]['author_id']) : false;

				if ( ! empty( $_POST['user_map'][$i] ) ) {
					$user = get_userdata( intval($_POST['user_map'][$i]) );
					if ( isset( $user->ID ) ) {
						if ( $old_id )
							$this->processed_authors[$old_id] = $user->ID;
						$this->author_mapping[$santized_old_login] = $user->ID;
					}
				} else if ( $create_users ) {
					if ( ! empty($_POST['user_new'][$i]) ) {
						$user_id = wp_create_user( $_POST['user_new'][$i], wp_generate_password() );
					} else if ( $this->version != '1.0' ) {
						$user_data = array(
							'user_login' => $old_login,
							'user_pass' => wp_generate_password(),
							'user_email' => isset( $this->authors[$old_login]['author_email'] ) ? $this->authors[$old_login]['author_email'] : '',
							'display_name' => $this->authors[$old_login]['author_display_name'],
							'first_name' => isset( $this->authors[$old_login]['author_first_name'] ) ? $this->authors[$old_login]['author_first_name'] : '',
							'last_name' => isset( $this->authors[$old_login]['author_last_name'] ) ? $this->authors[$old_login]['author_last_name'] : '',
						);
						$user_id = wp_insert_user( $user_data );
					}

					if ( ! is_wp_error( $user_id ) ) {
						if ( $old_id )
							$this->processed_authors[$old_id] = $user_id;
						$this->author_mapping[$santized_old_login] = $user_id;
					} else {
						printf( __( 'Failed to create new user for %s. Their posts will be attributed to the current user.', 'fixtech-demosetup' ), esc_html($this->authors[$old_login]['author_display_name']) );
						if ( defined('IMPORT_DEBUG') && IMPORT_DEBUG )
							echo ' ' . $user_id->get_error_message();
						echo '<br />';
					}
				}

				// failsafe: if the user_id was invalid, default to the current user
				if ( ! isset( $this->author_mapping[$santized_old_login] ) ) {
					if ( $old_id )
						$this->processed_authors[$old_id] = (int) get_current_user_id();
					$this->author_mapping[$santized_old_login] = (int) get_current_user_id();
				}
			}
		}
		
		
		
		/**
		 * Install demo data
		 **/
		function ajax_install_demo_data() {
		
			// Maximum execution time
			@ini_set('max_execution_time', 60000);
			@set_time_limit(60000);

			define('WP_LOAD_IMPORTERS', true);
			include_once( FIXTECH_TMDC_DIR .'one-click-demo/wordpress-importer/wordpress-importer.php' );
			$included_files = get_included_files();


			$WP_Import = new themetechmount_WP_Import;
			
			$WP_Import->fetch_attachments = true;
			
			// Getting layout type
			$layout_type = 'default';

			$filename = 'demo.xml';
			if( !empty($_POST['layout_type']) && $_POST['layout_type']=='rtl' ){
				$filename = 'rtl-demo.xml';
			}
			
			$WP_Import->import_start( FIXTECH_TMDC_DIR .'one-click-demo/'.$filename );
			
			
			$_POST     = stripslashes_deep( $_POST );
			$subaction = $_POST['subaction'];
			if( !empty($_POST['layout_type']) ){
				$layout_type = $_POST['layout_type'];
				$layout_type = strtolower($layout_type);
				$layout_type = str_replace(' ','-',$layout_type);
				$layout_type = str_replace(' ','-',$layout_type);
				$layout_type = str_replace(' ','-',$layout_type);
				$layout_type = str_replace(' ','-',$layout_type);
			}
			$data      = isset( $_POST['data'] ) ? unserialize( base64_decode( $_POST['data'] ) ) : array();
			$answer    = array();
			echo '';  //Patch for ob_start()   If you remove this the ob_start() will not work.
			
			
			switch( $subaction ) {
				
				case( 'start' ):
				
					$answer['answer']         = 'ok';
					$answer['next_subaction'] = 'install_demo_cat';
					$answer['message']        = __('Inserting Categories...', 'fixtech-demosetup');
					$answer['data']           = '';
					$answer['layout_type']	  = $layout_type;
				
					die( json_encode( $answer ) );
				
				break;
				
				
				case( 'install_demo_cat' ):
					wp_suspend_cache_invalidation( true );
					$WP_Import->process_categories();
					wp_suspend_cache_invalidation( false );
					
					// Output message
					$answer['answer']         = 'ok';
					$answer['next_subaction'] = 'install_demo_tags';
					$answer['message']        = __('All Categories were inserted successfully. Inserting Tags...', 'fixtech-demosetup');
					$answer['data']           = base64_encode( serialize( $data ) );
					$answer['layout_type']	  = $layout_type;
					
					die( json_encode( $answer ) );
				break;
				
				case( 'install_demo_tags' ):
					wp_suspend_cache_invalidation( true );
					$WP_Import->process_tags();
					wp_suspend_cache_invalidation( false );
					
					// Output message
					$answer['answer']         = 'ok';
					$answer['next_subaction'] = 'install_demo_terms';
					$answer['message']        = __('All Tags were inserted successfully. Inserting Terms...', 'fixtech-demosetup');
					$answer['data']           = base64_encode( serialize( $data ) );
					$answer['layout_type']	  = $layout_type;
					
					die( json_encode( $answer ) );
				break;
				
				case( 'install_demo_terms' ):
					
					wp_suspend_cache_invalidation( true );
					ob_start();
					$WP_Import->process_terms();
					ob_end_clean();
					wp_suspend_cache_invalidation( false );
					
					// Output message
					$answer['answer']         = 'ok';
					$answer['next_subaction'] = 'install_demo_posts';
					$answer['message']        = __('All Terms were inserted successfully. Inserting Posts...', 'fixtech-demosetup');
					$answer['data']           = base64_encode( serialize( $data ) );
					$answer['layout_type']	  = $layout_type;
					
					die( json_encode( $answer ) );
				break;
				
				
				case( 'install_demo_posts' ):
					//wp_suspend_cache_invalidation( true );
					echo '';  //Patch for ob_start()   If you remove this the ob_start() will not work.
					ob_start();
					echo '';  //Patch for ob_start()   If you remove this the ob_start() will not work.
					$WP_Import->process_posts();
					ob_end_clean();
					
					// Output message
					$answer['answer']         = 'ok';
					$answer['next_subaction'] = 'install_demo_images';
					$answer['message']        = __('All Posts were inserted successfully. Importing images...', 'fixtech-demosetup');
					$answer['data']           = base64_encode( serialize( $data ) );
					$answer['layout_type']	  = $layout_type;
					$answer['missing_menu_items']   = base64_encode( serialize( $WP_Import->missing_menu_items ) );
					$answer['processed_terms']      = base64_encode( serialize( $WP_Import->processed_terms ) );
					$answer['processed_posts']      = base64_encode( serialize( $WP_Import->processed_posts ) );
					$answer['processed_menu_items'] = base64_encode( serialize( $WP_Import->processed_menu_items ) );
					$answer['menu_item_orphans']    = base64_encode( serialize( $WP_Import->menu_item_orphans ) );
					$answer['url_remap']            = base64_encode( serialize( $WP_Import->url_remap ) );
					$answer['featured_images']      = base64_encode( serialize( $WP_Import->featured_images ) );
					
					die( json_encode( $answer ) );
				break;
				
				
				
				case( 'install_demo_images' ):
					$WP_Import->missing_menu_items   = unserialize( base64_decode( $_POST['missing_menu_items'] ) );
					$WP_Import->processed_terms      = unserialize( base64_decode( $_POST['processed_terms'] ) );
					$WP_Import->processed_posts      = unserialize( base64_decode( $_POST['processed_posts'] ) );
					$WP_Import->processed_menu_items = unserialize( base64_decode( $_POST['processed_menu_items'] ) );
					$WP_Import->menu_item_orphans    = unserialize( base64_decode( $_POST['menu_item_orphans'] ) );
					$WP_Import->url_remap            = unserialize( base64_decode( $_POST['url_remap'] ) );
					$WP_Import->featured_images      = unserialize( base64_decode( $_POST['featured_images'] ) );
					
					
					ob_start();
					$WP_Import->backfill_parents();
					$WP_Import->backfill_attachment_urls();
					$WP_Import->remap_featured_images();
					$WP_Import->import_end();
					ob_end_clean();
					
					// Output message
					$answer['answer']         = 'ok';
					$answer['next_subaction'] = 'install_demo_slider';
					$answer['message']        = __('All Images were inserted successfully. Inserting demo sliders...', 'fixtech-demosetup');
					$answer['data']           = base64_encode( serialize( $data ) );
					$answer['layout_type']	  = $layout_type;
					
					die( json_encode( $answer ) );
				break;
				
				
				
				
				case( 'install_demo_slider' ):
					
					$json_message		= __('RevSlider plugin not found. Setting the widgets and options...', 'fixtech-demosetup');
					
					if ( class_exists( 'RevSlider' ) ){
						$json_message	= __('All demo sliders inserted successfully. Setting the widgets and options...', 'fixtech-demosetup');
						
						// List of slider backup ZIP that we will import
						$slider_array	= array(
							FIXTECH_TMDC_DIR . 'sliders/home-classicmain-slider.zip',
							FIXTECH_TMDC_DIR . 'sliders/home-classic-2slider.zip',
							FIXTECH_TMDC_DIR . 'sliders/home-shopmainslider.zip',
							FIXTECH_TMDC_DIR . 'sliders/home-overlaymain-slider.zip',
						);
						
						$slider			= new RevSlider();
						foreach($slider_array as $filepath){
							if( file_exists($filepath) ){
								$result = $slider->importSliderFromPost(true,true,$filepath);  
							}
						}

					}
					
					// Output message
					$answer['answer']         = 'ok';
					$answer['next_subaction'] = 'install_demo_settings';
					$answer['message']        = $json_message;
					$answer['data']           = base64_encode( serialize( $data ) );
					$answer['layout_type']	  = $layout_type;
					
					die( json_encode( $answer ) );
					
				break;
				
				
				
				
				
				case( 'install_demo_settings' ):
					
					
					/**** Breacrumb NavXT related changes ****/
					$breadcrumb_navxt_settings						= array();
					$breadcrumb_navxt_settings['hseparator']		= '<span class="tm-bread-sep">&nbsp; &rsaquo; &nbsp;</span>';  // General > Breadcrumb Separator
					$breadcrumb_navxt_settings['Hhome_template']	= '<span typeof="v:Breadcrumb"><a rel="v:url" property="v:title" title="Go to %title%." href="%link%" class="%type%">Home<span class="hide">%htitle%</span></a></span>';  // General > Home Template
					$breadcrumb_navxt_settings['Hhome_template_no_anchor']	= '<span property="itemListElement" typeof="ListItem"><span property="name">%htitle%</span><meta property="position" content="%position%"></span>';  // General > Home Template
					
					// Getting existing settings
					$bcn_options    = get_option('bcn_options');
					if( !empty($bcn_options) && is_array($bcn_options) ){
						// options already exists... so merging changes with existing options
						$breadcrumb_navxt_settings = array_merge($bcn_options, $breadcrumb_navxt_settings);
					}
					update_option( 'bcn_options', $breadcrumb_navxt_settings );
					
					/**** Finish Breadcrumb NavXT changes ****/
					
					
					
					/**** START CodeStart theme options import ****/
					
					$theme_options = array();
					
					$theme_options['classic']	= 'eNrtXXlv3DiW_z9AvgOngl20MZatq864PeNJu3sa2E6yiYPewaIhsCRWldoqSZBYdjxBvvu-x0tHqQ6ny24b2HZcJ64SH8nHHx_fRVKhE7fvT76Uk_GkV17HaZglWdF7XU6Gk96rMQ2pb-O3waSX0LtsxfHLaNKbrZLkNo4YfnXU91wwHwQsYUuW8rL3mk6cyZd4YsvqC0YjBi1_hQrQ9jzJpjQJpjS8nhfZKo2QfoiM9FwnvXhJ56Jpe9JTvIhHcVR7CG0WLGeU154BXCd5VsY8ztLaUwd-U85puEDOagU-jDn-d71cJ-i8gcCM4o_kGjqM05QVz4lpmNUkQ-Dj5bze-Kh6DiwG4ark2bJO4MIUMRgszNEsw_4pcvRFjGBGl3Fyh2TQ_LucpeQjTUtRzZv0EJ1VblVELlS5ootsSY_JT9DmDfwuoYJVQvczxfQNLWIqxzlEjOarhIoBOTBezj5zixdQZ5YVdTahf-TO0oBcMNdOX9RyYIBxyqwFi-cLrspcXF-3mDDOWWGVOQ3jVCADFewuMIcR_mhMaJJYyKqUcNGonDVfcqLmeJ5l84RJsbEFXCfXVr3ViM3oKuFmKky5VRs5NPnKtgVTKHs1okV2wyoG2ZTanqAC3hdOgCsNBmXmbbw2bfDlXXlLk2jznAFXFzAjyTH5XCdLbhiPwx2zBq0MFLP3nDGpYbpnzO_ff8a8vjdyZ9tcJwWRcp8dUt422R49HFLe80Nqi0x5DyhT_rNDyt1cIlOe_XBI9Z8fUvafg9Tg2SG11QY_EFKudDH_FJj636ikBlsMn_tgAlWupruR2s-z-xawhtvAgm5Xec6KkJZsk7vQPxxq6FcV8yn9zj4WP1wn9uhop5iFUAL-3-OD91Qd481oQV0ICueMP5s16XpbpOuBVBfUna44z1KD0uBJoNRejBtH7mwfH_SjsgIBjzk-fcQRfqsJG-0c02xKC6seucPcF1pcXDRBMJ0HRiCA_4gW1_OC3el4TdJsTyiMod6C83xyejqLP3MWLk74AvDET0uoxU_CbKmLrIhyenqbW0pNnQrSUhefilbhK4T_HGYQxzCdn_yez_fLWVwwVGlmVd-_PXkhVoqKY9d0i4ppv9ZAwtmroISnt4uYy-lyGyRcIpcRNNqLXCIP_hOcDRXtgqZRwoogDpFzCg1-EbRJPC1ocadqXCJ48UzO1tgUinVKb1mZLZk2IzNKZtSiRZHdWlF2m1Zhu6yC6gS6KnXMfxPCI1wi_ramq-k0YVokdI1W3-or8kt4bAGwqyp_IGtcXN8Gapr1JJRLWvB8kaVSbF2vY_RBmGQl-8MY-E0MVvlBEXDtNQQU2_eEwMiTHHqXPBkZmfK0sX7bOVLXbxF2iJ7Dht5UiqnuWZlEIFst06DKq6K2CgZGousrtGD0Os9iuZagV8eVas0db1witKqcXo0eR8-zfIdiwu5rVK1RoWqrO01HGjNVZctC9VtErZZdx7RM4H-334ffXCdu_0iLkqqcsBkXLUhbDV2crRISJrQsv0caoftoyHvnZ0l8fhbrXCIpn1IWzs9OoajkRZbOz98kmNEjH1lxE4esnJydqgJik-8c3ztcIn5_QIaj8fDsFFs8XSXnrVELzV8xNfLuxxRLb1iS5czKJGdEs3a5pHEyIYajM0oWBZt938PnPJvE6Sz7O_tMl3nC0A7gn955--nZKT2vWP9fvrTKLARLamFWsSQ8yxIe59-Dbu_91hzYFtnzO2g2iB02h6a_LXgwp1UFoeUM1Q6b2D-8TdR9H9Ig4mIJoUtWkGnG9UD_gHlcXA9ZnCOp2OrobVmDTo3saUbM-wSBo81uev8b3HTXdsc73HQh7hq4PzOGfsAw8BGQQ1URhcVqOX2ayOHaDGkec5oo0LpA9A8bSw9GA3ATdkYcBsSbmN2qujRJ0Bwa414tbc2Th5sDxvmV-K-Wm9Uw7tfVZqnLA2jroL50AhoTvcDd4KodhQ4YGMUpjW4CjoQhKOdcItQG4A3lbJ4Vd-SiCBfxDRhjslaD07mu4ePe4rxFjG6uIQZtzIWpjWcxizSb7-FpSarnBAwNK1Rfo1p1uuKLrNDdAYAX4kGbPU_vcAcNYRiPzcacLN2Mutug6fAk9baunCEwDSjwSaArPZVN6XsbLg_9SVbmEBpcMKDBdhA8F3_08le0tdqbvXqx5T3P-F2u2TTg6Fwi5bxBPz9WMcRYFm7RVn2hh5bZk9Hx7pbEsjv8Jh1vS9uwUT0NJUrimAEFlfNFdNYQMxHDgiawVkVcIr77h3fhkAdLTPlJLsekDqc8ZqcqyhRSs6SfmxrBG2kxKUEMru8CfTBmOnFUnNtQJIEkU7WHttYVjdoNtdLw9sZdlG11PlYr03WO5f_2yXhwZOREzqthZM_prRRJHX_x9KscQgug5kgrnBTjJQMlvNA4YVwiXj4J4jSX8TO2eQXLm_yaFRG5WoADcYme98mJ1j-yBi4gnYmU1uCfMazM7Ja8oSn5leFcIs3Jv7LV3_QykiyU_C4xCQJpOkJrAaxcJybrZ2hNJOhhdKpjtle9858ur8jFW3Lx_v27n99e_XL59uovGJz1mnOP2Z2groDFepVmHskwvitBD1_rLIJIb-AgAYOzKL7R0aVszxJZLggqayXyURWHtvNL2TROdJh8CvX03-uNq9UBtAvv_A04JGen8OFs0T__q-N6OnS24WlfNbJxGPxWatGhc6BhwGpGU2XRhN9_LFwi9jaDWY-pm-Nxu8YD865yVKMDjSjJwGECqbDyOL3_kC6iCKxlaQZFXFyf_BjP-IKU_Jj8V1aSi3TOElYek08fLzqGqOQeRxqITIqR9BFM6BlYk3TTQNbTL6dIfn6VJQn5EYBcIhPikJrIOPa6oDT7HDit1QVeDKHkv1dgzNsdh7Rg3JIZetW9XFx3jjme2MwsaadnWDkajSSPKkcFospVZm97qrq2xIEj2jQPg36XJtio3ofrdLt8dc850lWblmFrT56_kbydxLNVh447BlvSPx4MoNfhkfastToX-aegXFxktx22T5iGLRlK5W6ULNNu6cJZZEuWpYnZWpEMbspe4awu2ZxcIpWF_mohjrMqTty16hsSW0hI4xSJHzeJso-HuEdcIsUZPPqRMtf4PnXkNrSCoY4mC2jI0cfHnGUlGb5Mygsh9TYRd4VT4j-9RKJcIstx2-ZpTuS3pXOc0YPs6rsKrr2npJt4-5SMa9UOFdruStXaJlXLs_wQ25h6PErotYxJ1VmynBaUG8TM5otTKSZjUPS2-VM_PrFVnTzM8QnEq0NUAufpHc43wc8Glt3nx7L3_Fj2nx_L_efH8uD5sTx8fiyPnh_L41wnzLK7wZTYT5dnce4mg3C3CEJOg2n2uR7ENEtUVsIxkXN-7vqnQ3K5ZMWcpeGdOQFxdpqbbA75VEJcXD6ybWJB1GM5nlwnsgc61hNX_1Q_m7f2R2uE0HL3zr73XDCn3USvD7SvL3_9UX_RyCB6d3FRcg3V2jEhdLNcXO0pNkjr8KMPJpw28DIVM-hUt-k3zcLBnOpDn38wOHmtwWxJumCqA4-eRRsxBQovED8mv96osANZXFwHaxUeEdr7ieCma6P92UhdG8WUVnM821Nacmq7wGqfLLM7iJ8IUHg8L_7Mov3QskEP4oFwhVZzUNuP3xghzO9kQtFs4NswrDf6MflPpHhNXFzbGROT5BRnt6Ax3FD5rXduvooQ8TeCOc0TcgFaW7RRkoJBkHfDopOXL5BW9o0G7jfSaxkJw485xaxN1ECk2-J056ks90F21-L0Xqq729x-W3i_aa1UkT2mGqfApJz0JF7GvB7Reo4sVnlzkfAM1K5EkK6W02rvD42kaAkPTSyzokpzg4B_uLz4gfzy7sOl-i4Ia-dAVPs6xMbiyuKroF5vErlVuW5BXFxTBjG0zFxcam6Qqjk0PNdg63MWeLyiSuZSZFrvrOn8eAsBEAcKjZVcIsfmqiPHLKXThAmp8lWOQ568ULN7Yb7gYqZcXPOsjovErFQTB0LF1Mcf1EdERwKuxOKN_FaK-UMNFZemdwd7x7M2dK6auaJzpPwqDcnaSLBDTIzQ9p7AGiU0iakv45910cDQGjRdPUpg6mTOsJqrXfC62-HtgnAdJW8DStunZ9tEKJPeGEU3tHaLqg1ru7wNabuXdTjxpHaeFXyWJXEW5EX2Owt5EAFxnJR6Bf2aFdfkh9qzcb0SriuzX1xc37x161RCGRQsgXFGdf4qClVYLSrUxR_kQ_JeclauN6yr6eU9Fkd1q8WNsrdOXSkLPEmmty67W5YbN0LPmZcP5DMNkjjsr64U4CtA9JkBZ42oNjKUFxExgIqe6Kluk2-5r-E4MkdYv5Ww5cKCrS8srEpWbLusMFZ3FSwl7ZsuaeAVhdhKwZjmNLr3xQS58GgrdPoag1DshR4UEnN47hHgczV8IBfRdlwwcbQSQQN1N4TimHhFdBD43L3gG0hd9xjAmYsyIU1YGtGnC523F3TQ1UdO-ap8BPBcXCN1SZbO1VWj6tLdThDDJM63LWFxON6aZtk1QHR9OCT9fYUQzeijKj-u7PZG7HyDXV1cXLfi16A8XDB-yvVq2c2602mM56hB1umWAusfZR3wVuwGfZzOE6DMcnGja82RHW8hlv5DI6uXz8D12GiCUYFKim6zW7VQM7Vjc8ya0WVcMF55QRsSUirnrG5zxxupqxECuh-v4yQpid4x3FTlEPclYZhsmfO7h74jyeMlewg7vA-iuBQuP-cM3xUVsv-HdQ_7vA-s4Bz_SD__ATTvqVwnzc3eJc0ttAk7PJ1732v11-CdgsjMzJ37w6hPVDYIVl0hAS6YYE3oXbXTLyk2KKRaG2sqaSjLlgwTGnoyROrAnLMFft-zosxSmpCfUxnX6dwMHlNWWw9BkwMMMvWh0BbRGhOOIdidQsHWGLgPhW_7wTSeH1Bmxsa24nno0sp2XgjXRmPDEhT3epoHP-997bk93Bou8IhcXH748O6DniZDuGRRvFoa2iFMxtVcIi5JDjaMLOkdWdAbRqaMpWQJshSRrCARSxgEiFwn5B-MlKuCEZ6RcMHCa3KXrQpS5iyBoc9P9MhMZ80D3rgwTBH292fcCIW-Lez7Se8cmVvTeF9a_7FP9LVQXx97T2E5lPqtg1gJN_jeZnwBs0FmiKs8FZyff8yK4u6YTFecpKoc1ipMYqTmULRHMJFcXJ6Q9wkDZUU4hJ10TuOU3MZ4nBhWA4ni2YzhJgm5Zne3WRGVXCe4s6i1SRlHTF_RWnuBRr1cXE1xo3xcXJULMyBVT-OaGeZxOmgClKK8lZgR2sXwo5y8ZmuDDgpURFwi5G43V-ta6aR2Jshfo9jYWINUrpL6bboaFLdZJlJsRbiOWI2l6TTHY-BrJLWO2I1-yWWDAmGSbjUqzNJkGn3tdIr8omBJed9qbCld6nBxRkOGMZZhvkmpXWkQ0VfG89rVLBogEDy9nvZo1d2jVTT_SRxe792otx8CWA90a7qjWbnZqVbxbWjVLw3UNg1qk25VllNn5twWRV5k0SrkFvimll5ZxoS6oh8Z21hoYK12etKvU6jCrl69brpVyhtpQzyjjILEC-AJVGTN1XOUtcH9LQK_P-EVTfKmRqzNYLOFBV8mcvm3LsOsUguPB0uVbq5FvHzRoukqFhtteOT8N3kdolmpZLlIeJ6bwoVTv4WBpxzPP7394fIDefPu7cerD5_eXFz9_O4t6FtHEPumIXOvvAdaGIyXUL7KuSAc0bgFswtzyUDzfuTwma9SFv0FmvKxKd1_dWfDb8Ozw446tn14Q9rg4KDWdI9dvQ0bu_ue3HXbXDCGJfifWaROq0DVv8dLNAhkVSTfCehKxA5cMClP5EFVmselQA2q_k2ezP0eL7j_FS-4TzzbPoY_8bEPH3z8MIAPA_wwhA_wXCfuHb1--WKaRXdfXr7IaYQCMiE2PAMvbx6n8vNX8vLFiRKfY3JSydIXKBBcJ3Vl1xPSq12vPybbDge3mv2iGkIMXCdkYOefgaB21Bee9eEZ1Gie8Z0QR5DW2ZWfLblzPnn5AhsjzYfEGYlqos9b3YONtdvtu4JQTOKEvHJHXtQfwQNcIrivQdEYgOutD8CzGy2N3FE4HrzeZ0ANLlOMbxINX5fmwVnRojwhdFqCDuVM9DSDBvr2f8BnEOoJ8fv40bpGxVadxJ4Q8REV6_98ZwH5UfXgX_IB1lpm_75fHYKVynv3k923xj3JyVfAEU87hEIPI3otYfHlzEVxmUNQOyFxKiZ2CoHTNU6E9r7zWYC3wCtLM8b3AdRdPrdFJJJ9-opGm9qpUZfJaq5o8g4ajFqbAbEmXCLNnVKVJjb0DQbQ4q1VNIGqqqY5ceoZUavuYGKJdjiaeGA2sPJZ3WEXXYOjZgWnXUHzUj1vkzWAQcZUc21YBh1VmtgM1ureVbd_q5oGnup5E5y-yi41kcF5vILH5BcRSZSNdOwGcHBSanXqyZYmPFwiew5PrSqUES-9QkIRsjSzi6LNn_B5qYOdNmmTD7tepzFIWcXwYSs-TJyEl7DiVKQjlNfpoeGeCzWKC6y69d8Xr_zki9ZFOXHFsvZGkpGt31wnEBbSbsPDOyaPZKBcMDRat2Qk1NEFvjPN7exhOBht6WHY7kF4D90dDLs76Pv-nkOoqYINQ-gGabgNJHEtVvfQEJvuPvxR9yjkDbINo8A7zfhGDZMMM7sLOoxROaxYiEU9VY0BlpSlenJKHZjSt79qnpTOgfmm9Pf1QlMVTaG4ido6GVIrRXep5LTgrX_4okXC0qh1WEkeddvC4nhtXDCBcj4rD1a6hK2BQdAt_9kNc-_VVosJLzWLLFcpDgrKgrF6YWCDGJOcuP0lX72mH4tTL9VLe9DNV8dtVTXzygh52s_UG3Qd4dJpVk2FodiGbbU26VqWVqeb16YwUJmGRgbUaznbhk-8ZI1vFIrYMgv0K5izvKL5-n9LUVQd';
					$theme_options['infostack']	= 'eNrtXXtv3Da2_z9AvgN3gntRYy1b0miecb2bTdN2gd2mmzjoXVxcFAJH4syo1kiCxLHjDfLd7zl8idJoHk7HqQ3cumnG0iF5-OPhefFwSqf-IJh-qqaTaa-6TrIoT_Oy97Kajqa9FxMa0cDF34bTXkrv8jXHX4Jp7zaJGX70xtPefJ2mIT4IWcpWLONV7yWdetNPydSVTZeMxgx6_QwNoN9Fms9oGs5odL0o83UWI_0ImRhMe8mKLkTX7rSn-BCPkth6CH2WrGCUW8-Ak1wirxKe5Jn11IO_Kec0WlwiZ9YLmESV_MceCQZvzH5O8UdyDQMmWcbKp8Q0rGiaI_DJamF3Pq6fA4thtK54vrIJfFhcIgaThTWa5zg-RY4-iRnM6SpJ75AMun9bsIy8p1klmvWnPURnXTg1kQ9NrugyX9FT8gP0eQN_V9DAqWD4uWL6hpYJlfMcIUaLdUrFhDyYL2cfucNLaDPPS5tNGB-5czQgwLU3EK08mGCSMWfJksWSq3d-oHtMGeesdKqCRkkmkIEGbheYoxh_NCY0TR1kVUq46FSuWiA5UWu8yPNFyqTYuIKTa8fuNWZzuk65WQrz3rFmDl2-cF3BFMqeRbTMb1jNIJtRty-ogPelF-JOg0mZdZtsLBv88ra6pWm8fc2Aq1ewXCLpKfmRpTeMXCfRnlWDXoaK2XuumNQu3SsWDO6_Yv1Bf-zPdy8KXCLlPzmk-rtke_xwSPWfHlI7ZKr_gDIVPDmk_B0y1XcfDqnB00PK_WOQGj45pHba4AdCypcu5h8C0-ALldRwh-HzH0ygqvVsP1KHeXZfAtZoF1gw7LooWBnRim1zFwbHQw39qnIxo9-4p-LnzB2f7BWzCN6A__f1wXusjvF2tDwRJS4YfzJ70u_vkK4HUl3QdrbmPM8MSsNHgVJ7M26dubd7fjCOygqEPOH49CvO8EtN2HjvnOYzWjp25A5rX2px0QThbBEagVww_mNaXi9KdqfjNUmzO6EwgXZLzovp-fk8-chZtDzjS8ATP62gFT-L8pV-5cSU0_PbwlFq6lxckFb69bnoFX6F8J_DCuIcZouz34rFYTkLgCrLnfr3L09eiJ2i4tgN3aJi2s8WSLh6NZTw9HaZcLlcXH6DROQywkZ_cdyHfwRnI0W7pFmcsjJMXCLknEKHnwRtmsxKWt6plgheMperNTEvxT6lt6zKV0ybkTklc-rQssxvnTi_zeqwXTZBdQJDVTrmv4ngERH_dWbr2SxlWiR0i9bY6lfkl_DEAWDXdf5Atri-DdUy60WoVrTkxTLPpNj6_Y7Zh1GaV-x3YxA0MVgXR0XAdzcQUGzfEwIjT3LqXfJkZGTGs8b-bedH_aBF2CF6Hhv1Z1JM9cjKJALZepWFdU4VtVU4NBJt79CS0etcIk8ynXv1fKnW_Mk2QqfO6Vn0aGuqZX4b8ryYoR8xm3oKdPmkMV9oqHUVcmRRtCaK2s72o040jKpJc-8GUg1qBBs0rY59z3RM4F9_MIC_z_zBiRYu1Thlcy56ELDDwBfrlEQprapvkUQoQxrx3uVFmlxc_jtfl-SqhKFYTPyA_Ai_V-Q9K2-SiJGfy_wmiVn5p4tzoL04X6eXrdkIJW9G88bD3cNdVLzMs8XlRaJJ5D4RMkn4yqllCoZLLq9oek2ucvLmI9heTqYX56oDcgFmNzPjsNTJ8t6lS77xgv4JCQZDMhpPRkAOVJc19_-LQ-QR2E0Hc4gV4Xme8qT4FjR579fm3HZIWtBBs0XIsDs09G15AqDqBkKnGao9FnBwfAuoxz6m-cN9EMGQrCSznOuJ_g5juBmgeFwnUo3Z6O0wjZ5F9jjj40NCvvF2p3zwBU657_qTPU65EHcN3B8ZMT9g0PcVkENVEUflejV7nMjh3oxokXCaKtC6QAyOGzkPx0NwCvbGFwbEm4TdqrY0TdHUaUfJ2tqapz4mI40alvivV9vVMJ7OWavUZdzbOmgg7XtjoZd49lv3o9ABA6M4pfFNyJEwAuVcXEbaXDC8ppwt8vKOvCqjZXLDqinZaMHpQrcI8CRx0VwiRqfWEIM25sJAJvOExZrNn-FpRernBAwNK9VYY6s5XfNlXurhXDDAV-JBm72-Ps9uAu8NhuYcTr62YW-HLBbJIe4ULhRYCJT7NNRtH8tJ9L3tVx-nyKoC4gHANdyOhUii-PijtYCitVpvd-XFOfdcIud3hWbTgKNfaadx2vu-Dhwm8uUOpTUQ6miVPxpV7-_IJvujL1L1rjQRW7XUSKIkagsobIBPYrCGmInAFRSCsy5TgfoD5DKQh7NCzkbVonyd4VQ4KSRlRT-GXY4JiEYFS399F-oKGBlyYUDb0CGhJFOtR65WE43Wu9JJGAtuErdVy0RtSN87lf-6Z5PhiREPuZyGlwNXtdYfNvji6Wc5ixZGzcmqE9laq1YMVPDSRKeIgngSJlkhY2Xs8wp2NfklL2NytQT34Q363WdnWu3IFrhvdNZR2oIfE9iQ-S15DaHULwz3ZkEgXCL8i949koWK36XaH0iyOdgP2N9NEhMBqtlbK4rJmXBbahDpTJc6CyDSE8g4gHARXCc3OsqTHTpcIksFAaD1Rj6qg8p2fiifJTADEVFenEM7_d_NzpW4A-2yf_kaXFyMi3P4cLEcXFz-2fP7GFiOyHjiufB4oHrZOg9-KzXiyDvSPGB_otlxaMrvP5k3K5rUs0Fm_8o-0lWRMtz37fn4XfNZlkwlmcZHmlGagw8EcuEUSXb_Kb2KY7B8lZkUJjC-T-Z8SSp-Sv6RV-RVtmApq07Jh_evOqYovaAIZxqKFISR4zEsaCPF0J6IlbfQjItcXMNVnqbke1wwikyJR5TMYDLCczcFpTkmWskLSlww5fm3vRe9yx_AIyGU_GsNhvninF7q3aw2ViPPo_2TUe0TNDIzel8G5r3KvO1OJVt7mIJD29TqQ7drq-_SyqNN0n0Odt870U2bCn3fYP1ga4t2Ys1VY3r-BKzA4HQ4hIFHXCet2Qm1vWNA5QFULNee4tJb5iuWZ6k54pAsbMsr4eqt2IJcIpWDLmQpykqVkfQ3mm9JOSEhTTIk_rrpjUOctgNSHN7wuKVdc_HP7kDduCY2clt6wehDk4U04uh2YzaxkdXFRKYQw_424g7nvh4D90FcXOYFHp88zoX8skSLN36Q03VfwXXwknQT716SidXsWNHmviSqa5KoPC-OcZyo56OEXsuYVI4VK2hJ-eaJh1crJmM49PH1Yy9j2KlOHqaMAfHqEJXQe3xF8iYw2cKy__RY7j89loOnx_Lg6bE8fHosj54ey-Onx_LkEbPsbzEl7uPlWdS_5BC1lmHEaTjLP9pBTPONSi6IsrkhJkqKSz84H5E3K1YuWBbd6WIECPMLk5UhHyoIr8euSxyIehyv3xdJXDAdsYkreGqc7Yfu4w1C6Ln7zL3_XDBVZ2LUBzpxl3_9Xn_RyCB6d0lZcQ3VRrkOulm-9hQbpDb86IMJpw28TMUMOtVt-m2rcDSn-tiVCQanfmsyO5IrmM_AErB4K6ZA0Q_Fj0l_NxrsQRb3wUaDrwjt_URw2_XNwXysrm9i6qo5n92pK7m0XWC1s1JuB_EjAQrL5JKPLD4MLRf0IBZmK7Sak9pdGGOEsLiTiUNztO7CtF7rx-S_keIl8V1vQkyuUlRVQWd42PFr79L8KkLEXwnmLs_IK9Daoo-KlAyCvBsWnz1_hrRybDRwv5Jey0gYfsyRgTZRQ5FuS7K99VL-gxx7Jdm9VHe3uf2y8H7bXqkje0w1zoBJuehpskq4HdH2Pflapb9DUQWpDhfCbL2a1UdzaCRFT1jOsMrLOlsNAv7uzavvyD_fvnujfheEVoWG6l-H2Pi6tvgqqNeHPX79XvcgrguDGDpmLTU3SNWcGjSfuLoCAgsfQlnmB3OjyLQ-9dJ58BYCIA4UOqtEjs1Xpb8so7OUCakKVI5D1kSo1X1lfsHNTLnmWRVyJKwyFZ5yo8HH79RHREcCrsTitfytEuuHGiqpzOgejo5VMHShurmiC6T8LA3JxkxwQEyM0Hbuf4MSusTUl_HPumhgag2arhElMDaZN6rXah-8_m54uyDcRKm_BaXdy7NrIZRJb8yiG1q3RdWGtf2-DWl7lE04sWK6yEs-z9MkD4sy_41FPIyBOEkrvYN-yctr8p31bGI3wn1lznIDube0vq2phDIoWQrzjG3-agr1st5UqIvfyYdYMoycVZsd62Z6e09EEW29uVH2NqlrZYE1XvoEsrtnZF3pOfMlXDDFXFyDJIruVWk_fhWHPs_3NoismaG8iIgBVPRUL3WbfMe9Cc-TOUL7dsCOiwOuvjiwrli569LARN0ZcJS0b7ssgVcFElwnA2Na0PjeFwTkxqOt0OlzAkJxEHrwkpiytq9cMJ-v4QO5iHcDiLOVCBqouyEUBdw10VHg8w-Cbyh13ddcMM5cXFiJaMqymD5e6PoHQQdDveeUr6uvXDCeb6QuzbOFuvJTX37bC2KUJsWuLSzK1p1Znl-v1E2R4yAZHCqEaEa_qvLjym5vxS4w2NniuhO_BuUR8FOuV8tu2k6nMZ7jBlmnWwqsv5dtwFtxG_RJtkgZ3lESN6s2HNnJDmLpPzSyesUcXFyPrSYYFaik6Da7dQ-WqZ2YAmhGVyF45SVtSEilnDPb5k62UtczBHTfX1wnaVoRfWK4rckx7i3CNNmq4HcPfVeRXCcr9hB2-BBEcSuIm1QJy1wi9v-wHmCfD4EVnOPv6cffgeY99aS5YbuihYM2YY-nc-_7pcEGvDMQmbm5-34c9YnKBsGyFRLgggnWlN7VXCf9kmKLQrL62FBJI_luxTChoRdDpA5MDSzw-zMrqzyjKfl7JuM6nZvBEmJ19BA2OcAgU9d2tog2mPAMwf4UCvbGwH0oAzcIZ8niiDIzMbYVa5UrXCffezFbG40tW1DcuGnWb977-nF7uhYu8Ii8effu7Tu9TIZwxeJkvaovuMJiXFwtk4oUYMPIit6RJb1hZMZYRlYgSzHJSxKzlEGAeEb-xki1LhnhOYmWLLomd3j_tSpYClNfnOmZmcGaxde4McwrHO-PuKsJYzs49qM-OTJ3lfGWsv7jnukLm4EuSc9gO1T62_-wER7w_ZTzJawGmSOusri3uHyfl-XdKZmtOcnUe9irsIixWkPRH8FEcnVGfk4ZKCvCIeykC5pk5DbBqmDYDSRO5nOGhyTkmt3d5mVcXJ3hyaLWJlUSM315auOLLOz3aokb71wn9XthBqTqaVxcXDDDPE4HTYhSVLQSM0K7GH6Uk9fsbdhBgYpIhNzt7qyhlU5qZ4KCDYqtnTVI5S6x77lZUNzmuUixldEmYhZLs1mB1dwbJNZA7EZ_2WSDAmGSbjUqzMpkGgPtdIr8omBJed9qbhld6XBxTiOGMZZhvkmpXWkQ0RfG89rXLRogEDy9nw7o1T-gVzT_aRJdH9xp_zAEsB3o1mxPt_KwU-3i28ixa_-tQwNr0Z3acurMnN-iKMo8XkfcAd_U0TvLmFBfjCNjGwcNrNNOTwY2hXrZNWq_m26d8UbaEGuUUZB4CTyBirRcXD1PWRs831wi8PcHvDxJXlvE2gw2e1jyVSq3v9-8OrHOHCwPlird3G54_qxF0_VaHLRhyfmv8lZDs1HFCpHwvDQvl559mQKrHC8__PTdm3fk9duf3l-9-_D66u9vfwJ96wniwHRkbnz3QAuD8RLKVzkXhCMat2B2YS0ZaN73HD7zdcbiP0FXAXalx6-vXgRtePbYUc91j29IGxwc1ZoecKq35WD30Mpdvw1gVIH_mceqWgWa_jVZoUEg6zL9RkBXIXZcMEh1JgtVaZFUAjVo-hdZmfstXj3_M149n_Zd9xT-JKcBfAjwwxA-DPHDCD7An6R38vL5s1ke3316_qygMQrIlLjwDLy8RZLJz5_J82dnSnxOyVktS5_ghajUlUNPSc-6-H5KdhUHt7r9pDpCDKdk6BYfgcAq9YVnA3gGLZo1vlPiCVKbXfnZkVwn59Pnz7Az0nxIvLFoJsa81SO42Lrdvy8IxVwiTskLf9yPB2N4QAT3FhSNCfj9zQn03UZPY38cTYYvD5lQg8sM45tUw9eleXBVtChPCZ1VoEM5EyPNoYOB-1_wGYR6SoIBfnSuUbHVldhTXCI-omL9n28cID-pH_xbPsBWq_w_92tDsFF173Hy-7a4XCc5-Qw4YrVDJPQwotcSlkCuXFycVAUEtVOSZGJhZxA4XeNCaO-7mId4Mbu2NBO8qW-7fH6LSCT79BWNNrVnUVfpeqFoig4ajFqbAbEmXCLNk1KVJjb0DQbQ4m00NIGqaqY58eyMqGM7mPhGOxxNPDAbWPus_qiLrsFRs4HXbqB5qZ-3yRrAIGP6W5FasAw7mjSxGW60vatv5tYtDTz18yY4A5Vdalwig-t4BY_JP0UkUTXSsVvAwUWx2tjJliY8XCJ7Dk-dOpQRXzWFhFwiZGlmF0WfP-DzSgc7bdImH67dpjFJ2cTw4So-TJyEl7CSTKQjlNfZR8O9EGoUN1h9EX8gvnqTL1sX5cRVSusrK8auvuIfldJuw8M7JksyUFwwGr07MhLqGAK_u8zvHGE0HO8YYdQeQXgP3QOMugcYBMGBU7BUwZYpdIM02gWSuN2qR2iITfcYwbh7FvIG2ZZZ4NVk_JILkwwzpws6jFE5rESIhZ2qxlwwS8qSnZxSBVP69pflSekcWGDe_rb50jRFUyjumrYqQ6y36C5VnJa89T-gaJGwLG4VK8lStx0sTjYmECrns_ZgpUvYmhgE3fJ_f6FylzMBpFwnS7NklqsShYLyxUR9cZ9NLMpb6u_NQX9e1dWqzupvKjHHX9ZQ5osdZNGf6XXYVcmls62aCiOyLadrbdKNZK3OOm-sZKgSDo1EaL_lcxs-8U41fuVPzFZ5qL8ROS9qms__B00fLlM';
					$theme_options['overlay']	= 'eNrtXf9v3DaW_z1A_geei1s0WMuWNJqvdb2bTdPuArdNL0mxtzgUAkfizKjWSILEseMG-d_vPX4TpZHkcTpObeDqJp4RH8nHDx_fN5IKXfjjYPGxWswXXCfVVZJFeZqXXCffVIvp4uSrOY1o4OK3yeIkpbf5juOXYHFyk8QMP3qzxclql6YhPghZyrYs49XJN3ThLT4mC1dW3TAaM2j1E1SAdtdpvqRpuKTR1brMd1mM9FNkYrw4SbZ0LZp2F1wnig_xKImth9BmyQpGufUMOCnyKuFJnllPPfhNOafRBjmzCmAQVfKb3RN03hj9iuKP5Bo6TLKMlU-JaZjRNEfgk-3abnxWPwcWw2hX8XxrE_gwRQwGC3O0yrF_ihx9FCNY0W2S3lwiGTT_pmAZeUezSlQbLU4QnV3h1EQ-VHlPN_mWnpIfoM1r-F1BBaeC7leK6WtaJlSOc4oYrXcpFQPyYLycfeAOL6HOKi9tNqF_5M7RgFww195Y1PJggEnGnA1L1huuyvxAt5gyzlnpVAWNkkwgAxXcLjCnMf5oTGiaOsiqlHDRqJy1QHKi5nid5-uUSbFxBVwnV47dasxWdJdyMxWm3LFGDk1-5bqCKZQ9i2iTX7OaQbak7khQAe8bL8SVBoMy8zbfmzb48qa6oWncP2fA1UuYkfSU_J2l14xcJ9EdswatTBSz95wxqV26ZywY33_GRuPRzF8NTwpcIuU_OaRGQ7I9ezikRk8PqQGZGj2gTAVPDil_QKZG7sMhNX56SLl_DFKTXCeH1KANfiCkfOli_iEwjT9TSU0GDJ__YAJV7ZZ3I3WYZ_c5YE2HwIJud0XByohWrM9dGB8PNfSryvWSfu2eip8zd_biTjGLoAT8vy8P3mN1jPvR8kSUuGb8yaxJfzQgXQ-kuqDucsd5nhmUJo8CpfZi7B25Nzw-6EdlBUKecHz6BUf4uSZsdueYVktaOnbkDnNfanHRBOFyHRqBXDD-Y1perUt2q-M1STOcUJhDvQ3nxeL8fJV84CzanPEN4ImftlCLn0X5Vhc5MeX0_KZwlJo6F6SVLj4XrcJXCP85zCCOYbk--7VYH5azXDCostypv39-8kKsFBXH7ukWFdN-skDC2auhhKc3m4TL6fIbJFwilxE22ovjEfxcJzibKtoNzeKUlWESIecUGvwoaNNkWdLyVtVE8JKVnK25KRTrlN6wKt8ybUZWlKyoQ8syv3Hi_Carw3ZZBdUJdFXpmP86gkdE_O0sd8tlyrRI6BqtvtVX5JfwxAFgd3X-QNa4ugnVNOtJqLa05MUmz6TY-qOO0YdRmlfsd2MQNDHYFUdFwHf3EFBs3xMCI09y6F3yZGRkybPG-m3nR_2gRdgheh6bjpZSTHXPyiQC2W6bhXVOFbVVODESba_QktGrXCJPMp179Xyp1vx5H6FT5_QserQ11Sa_CXleLNGPWC48Bbp80hgvTF7dCvJk0bSGivrO9qReaCBVlYHVG7SIWi37nmmZwP_-eAy_z_zxCy1fqnLKVlxctCDFBfi52KUkSmlVfYs0QiHSiJ9cXF6kyeVFoouk0EoBubw4Ty6_9vzRCxKMXCdOMJ3N3YtzJO-owrJrluYFc3JZL8lW-V_ZB7otUoYaubfilhbwp7wC3VwnKv5tl6YVecfBXCffbU_JK5omYKCyhMoWznfpZQtNYWbMYEcg5f_Lt06VR2AcHUwUVoTnecqT4ltQ11wnvzSrD4hT0EHTI0nYHFrzQaERistQ3WHmxsc3c7rvY9o4FPUIumQlWeZcXA_0d1i8_SjEeyF1lY3ewAryLLLHGQQfEtfN-j3v8Wd43r7rz-_wvIW4a-D-yLD4ASO7L4Acqoo4Knfb5eNEDtdmRIuEg2L9rU_8vOC44fFkNgHLf2cQYUC8TtiNqkvTFI2Z9oaspa15GmEaxKhhif9uO2C7XCeaSsxSl_1u66CxNOGNid7gBm_djkIHDIzilMbXIUfCCJRzGWkD8Ipyts7LW_KyjDbJNasWZK8Gp2tdI8DtwnWLGD1XQwzamAuLmqwSFms2f4KnFamfEzA0rFR9zazqdMc3eam7A1wwX4oHbfZGetM6bAjDfG722mTpoMdk0RziMeFEgYVAuU9DXfexbDff236NcIisKsDpB1xcw34sRKbExx-tBRStVbvfXxeb2euc3xaaTQOOLlKeEvTzfR0dzGXhgNIaC3W0zR-NqvcHUsb-9LNUvStNRK-WmkqUxAECCprno-isIWZcIjoFheDsylR8D47vySEPjpjys0KOSR07-ZKdqvhRSM2Wfgi70oMgJhWIwdVtqI-8yBgLI9iGPgklmao9dbXKaNQeyh9h8LdP3FYzc7U4fe9U_u-ezVwnL4yoyKk1vBw4w7UusadAPP0kR9HCqDnY0aylYSsG6nhjwlFEQTwJk6yQwTG2-R5WOPlXXsbk_QZcXInX6IOfnWkVJGvgGtJpRmkX_p7A4sxvIK7KyL8YrtOC_Dvf_UWvJMlCxW_rBIQ0XCKRg9oO4vMmpYm7FAjWxGJSJuxLCVwiHcaIFWjZKx39i7QE8g_Du4iTax0pygYdkZ26JHaJfFTHlO28UL5MUhXJXpxDPf33fuNK9oF2M7qEqDO9OIcPF5vx5Z8hBMYImMhcMBieyEZ6h8FvpI6cekcaBqxVNEQOTfn9x_J6S5N6MPtxeXM8ftd4NiVTuaXZkUaU5uAVgVg4RZLdf0gv4xhsYWUGRfyAfJ-s-IZU_JT8V16Rl9mapaw6JT-_e9kxRCXSONJQJDuMGM9gQi_AVmR9A9nLkFxcnCP55fs8Tcn3XDAUWRCPWFwi47n7gtLsc4JyQgmgvPr25KuTyx_ARyGU_PcOTHW744iWjDtyGanu6aVe9GrhNZI_2qWZ1m5EI1-i121gylVGbjjFbK1x4Ig2lf9k3KUKbOXdaG66T3eXQz7yXuiqTaU_2NMo6CVv59lcXNWh58_BTIxPXCcT6HX6ojUuodcHjJJyFyqWa7dy423yLcuz1Gx6SBb6klA4b1u2pkglNHApDpoqK-rvVe_JTyEhTTIk_rK5kEM8vAPyId7kuIe9VuK_4aje-C42cj2tYKiiyUIacfTRMfVYS0Yg0-VCDEd9xB2RQN0HLoK4zAvcUHmcE_l5WRlv9iD77b6C6-Ap6SYenpK5Ve1YoeldGVfXZFxceV4cY4NRj0cJvZYxqRwrVtCScoOY8be9WjEZk6E3tB_7wYZBdfIwBxsQrw5RCb3Hd2zeRC49LPtPj-XR02M5eHosj58ey5Onx_L06bE8e3oszx8xy36PKXEfL8_iREwOAW0ZRpyGy_yDHcQ0S1TewTOxcXHpB-dT8nrLyjXLolvyjpXXScSqi_PC5GvIzxVE3jPXJQ5EPY43Gon8gI7YxKU81U__Dv1sjxBa7t6gHz3AOTTR6wNtz8tfv9dfNDKI3l1SVlxcQ7V3gAfdLF97ig1SG370wYTTBl6mYgad6jZ93ywczak-9jEGg9OoNZiBtAomM_BQWNyLKVCMQvFj8uONCncgi-tgr8IXhPZ-XCLYd6FzvJqpC52YtGqOZzhpJae2C6z2ZoLbQfxIgMKDc8kHFh-Glgt6EPdiFFrNQQ2fojFCWNzKlKHZh3dhWK_0Y_JcJ6T4hviuN1wnJo0pjmBBY7gb8svJpfkqQsRfCGYtz8hL0NqijYqUDIK8axafPX-GtLJvNHC_kJOWkTD8mM0EbaImXCLdlmR3Hq7yH2R3LMnupbq7ze3nhfd9a6WO7DHVuAQm5aSnyTbhdkQ78mSxyoyH4lxcpNp3CLPddlnv3aGRFC3h2YdtXtaJbBDwt69ffkf--ebta_VdEFrHOVT7OsTG4triq6BebwP5dbluQVxcIAYxdMxcXGpukKo5NDye4OrjEnhKXCKUZwJhbBSZ1ttiOgPeQlwwxIFCY5XIsfnqMDDL6DJlQqoCleOQByjU7L40X3AxU655Vqc-ElapiQOhYurjd-ojoiMBV2LxSn6rxPyhhkoq07uHveORGbpWzbyna6T8JA3J3kiwQ0yM0HbWf48SmsTUl_HPumhgaA2arh4lMDaZN63n6i54_WF4uyDcR2nUg9Lw9AxNhDLpjVF0Q-u2qNqwtsvbkLZ72YcTz1AXeclXeZrkYVHmv7KIhzEQXCdppVfQv_LyinxnPZvblXBdmc3eQK4trW9rKqEMSpbCOGObv5pCFdaLCnXxW_mQ_CQ5q_Yb1tX08p6LE7f14kbZ26eulQUeCNObk90tI-tKz5nXAhQrDZI4hq8O--PLOfSGv7dHZI0M5UVEDKCiF3qq2-QDNyk8T-YI7fsCA1cJXFx9lWBXsXLoGsFcXN1cInCUtPddn8DLA4mTgTEtaHzvKwNy4dFW6PQpAaE4CD0oJOYM3BeAz9fwgVxcxMNcMOJoJYIG6m4IxWnvmugo8PkHwTeRuu5LXDBnrrBENGVZTB8vdKODoIOu3nHKd9UXXDDPN1KX5tlaXQKqr8PdCWKUJsXQEhZn3J1lnl_h1YnjIRkcKoRoRr-o8uPKbvdiFxjsbHEdxK9BeQT8lOvVspu202mM56xB1umWAuvvZB15qcWiT7J1yvDWkrhrtefIzgeIpf_QyOoVK3A9ek0wKlBJ0W126xYsUzs3p6UZ3YbglZe0ISGVcs5smzvvpa5HCOi-u0rwgpDeMeyrcoybjDBMti347UPfXuTJlj2EHT4EUVxcCq8_FAzf4hSx_4f1XDD7fAis4Bx_Tz_8DjTvqVwnzZ1b6zrdUW-cBnvwLkFkVuY2_HHUXCcqGwTLVkiAi33yNKgpehSS1caeSprKsi3DhIaeDJE6MIdkgd-fWFnlGU3JPzIZ1-ncDJ4xVlsPYZMDDDL1sc8W0R4TniG4O4WCrTFwH8rADcJlsj6izMyNbcXDzJWT33lVWxuNniUoruc0j3be-0Jye7gWLvCIvH779s1bPU2GcMvwsqihncJkvN8kFSnAhpEtvSUbes3IkrGMbEGWYpKXJGYpg1ww8Yz8jZFqVzLCcxJtWHRFbvNdSaqCpTD09ZkememseTobF4Ypwv7-iIud0LeDfT_qnSNzdRkvLes_7pm-3RnoM-sZLIdKvw8QK-EG348538BskBXiKs_9Fpfv8rK8PSXLHVwnmSqHtQqTGKs5FO0RTCRXZ-SnlIGyXCIcwk66pklGbhI8MAyrgcTJasVwk4RcXLHbm7yMqzPcWdTapEpipm9a7b3awi5XU9won9flwgxI1dO4LYZ5nA6aEKWoaCVmhHYx_ChcJ6_Z2qSDAhWRCLnbzVldK53UzgQFexS9jTVI5SqxL8VZUNzkuUixldE-YhZLy2WBB733SKyO2LV-_WSDAmGSbjUqzMpkGgPtdIr8omBJed9qbBnd6nBxRSOGMZZhvkmpXWkQ0a-M53VXs2iAQPD0ejqgVf-AVtH8p0l0dXCjo8MQwHqgW7M7mpWbnWoV30SOfS3A2jSwJt2pLafOzPktiqLM413EHfBNHb2yjAn1RT8ytnHQwDrt9GRgU6jCrl5H3XS7jDfShnhGGQWJl8ATqEjL1fOUtcH9LQK_f8abluSVRazNYLOFDd-mcvm3rrvsMgePB0uVbi4-PH_WoukqFhtteOT8F3nhoVmpYoVIeF6awo1n37PAU46XP__43eu35NWbH9-9f_vzq_f_ePMj6FtPEAemIXM9_AS0MBgvoXyVc0E4onEDZhfmkoHmfcfhM99lLP4PaCrApnT_9a2MoA3PHXbUc93jG9IGB0e1pgfs6vVs7B56ctdvAxhV4H_msTqtAlX_mmzRIJBdmX4toKsQO1wwpDqTB1VpkVQCNaj6F3ky91u8p_5nvKe-GLnuKfxJTgP4EOCHCXyY4IcpfIA_ycmLb54_W-bx7cfnzwoao4AsiAvPwMtbXCeZ_PyJPH92psTnlJzVsvQRCsRJXdn1gpxYt-RPydDh4FazH1VDiOGCTNziAxBYR33h2RieQY3mGd8F8QSpza787Mid88XzZ9gYaT4k3kxUE33e6B5cXKzdbt8XhGISF-QrfzaKxzN4QAT3FhSNAfij_QGM3EZLM38WzVwn3xwyoAaXGcY3qYavS_PgrGhRXhC6rECHciZ6WkEDY_c_4TMI9YIEY_zoXFyhYqtPYi-I-IiK9X--doD8Rf3g3_IB1trmv92vDsFK1b37ye9b457k5BPgiKcdXCKhhxG9lrAEcubipCogqF2QJBMTu4TA6QpcJ0J738UqxFvctaWZ47V-2-XzW0RcItmnr2i0qT2Lukp3a0VTdNBg1NoMiDURae6UqjSxoW8wgBZvr6IJVFU1zYlnZ0Qd28HEEu1wNPHAbGDts_rTLroGR80KXruC5qV-3iZrXDCDjKnm2rBMOqo0sZns1b2tr-7WNQ089fMmOGOVXWpcIoPz-B4ek3-KSKJqpGN7wMFJserYyZYmPFwiew5PnTqUEW-eQkIRsjSzi6LNH_B5pYOdNmmTD9eu0xikrGL4cBUfJk7CS1hJJtIRyuscoeFeCzWKC6y-tT8WL-Pkm9ZFOXGJ0nqxyMzV7wOISmm34eEtk0cyUFwwGq07MhLq6ALfZuZ39jCdzAZ6mLZ7EN5DdwfT7g7GQXDgECxV0DOEbpCmQyCJi6-6h4bYdPcRzLpHIW-Q9YwCby3jGzFMMszsLugwRuWwEiEWdqoaAywpS3ZySh2Y0re_LE9K58ACU_rrfqGpiqZQ3DVtnQyxStFdqjgteeufpGiRsCxuHVaSR90GWJzvDSBUzmftwUqXsDUwCLrlP4ihcpdLAaRcJ49mySxXJQ4KyoK5epWfTSyOt9Qv2UF_Xp2rVY3VrzUx219WV-bND_LQn2l10nWSS2dbNRVGZD27a23SvWStzjrvzWSoEg6NROio5XMbPvE2Nb4fKGbbPNTvSM6LmubT_wGQcTQS';
					$theme_options['rtl']	= 'eNrVXety20aW_u8qvwPC1FTFNYKIG6-RNeNynOxUTeJMrFTt1laK1SRBEhEIYIGmZMXxj8Rx4s3uS8ykdnzJxIlcJ8mm8nefAnybPadvuBCEKFtSpCi2yMbp7tNfnz637oZJ32o5_XtJv9dvJPteMAr9MG68mfQ7_cbrPTJcIo6B39r9hk-OwgXFL91-Y7Lw_UNv7OJXU3wfYMHA9d25G9Ck8Sbpm_17Xt_g1WcuGbvQ8n2oXDBtT_1wSPzBkIz2p3G4CMZI30FGWv2GN1wnU9a00W8IXliRN84VQpuxG7mE5sqAkyhMPOqFQa7UhN-EUjKaIWe5Bw6M2fsk3xN0XkBgQvCHcw0dekHgxpeJaZhVP0Tgvfk033g3KwcWB6NFQsN5nsCCKXJhsDBHkxD7XCfI0T02ggmZe_4RkkHztyM30O6QIGHV7H4D0VlEekZkQZU9MgvnZEt7B9o8gN8JVNAT6H5cIpg-ILFH-Dg7iNF04RM2IBPGS927VKcx1JmEcZ5N6B-50yUgwLXZYrVMGKAXuPrM9aYzKp5ZjmzRdyl1Yz2JyMgLGDJQwagCszPGH4kJ8X0dWeUSzhrls-ZwTsQcT8Nw6rtcXGwMxsm-nm917E7IwqdqKtRzPTdyaPJ1w2BMoezliGbhgZsx6A6JYTMq4H1mDnClwaDUvPVWpg2-3E4OiT9eP2fA1Q2YEX9L-xfXP3CpNzpm1qCVtmD2hDPGNUz1jDmtk8-Y3bK71qR-UhAp69IhZdfJdvfskLIvH1I1MmWfoUw5lw4pq0ambOPskGpdPqSM3wap9qVDqtYGnxFSFncxfxOYWi-ppNo1hs86M4FKFsPjkdrMs3sZsDp1YEG3iyhy4xFJ3HXuQuv0UEO_Kp4OyRvGFvvZNrrXjhWzETwB_-_8wbuojvF6tKAuBIVTl16aNWnZNdJ1RqoL6g4XlIaBQql9IVAqL8a1Izfrxwf9iKzAgHoUS89xhC9rwrrHjmkyJLGej9xh7mMpLpJgMJwOlEBcMP9jEu9PY_dIxmuc5pQSCjCOINSz7y-fWWBiLILMlYUvAs77uREgtNk4ofRw5lGOpVUgYYmGQaG98diG_xhnHUE7I8HYd-OBN0LOCTR4j9H63jAm8ZEcxf7hYOLdpe5oxkp6ioAtJHLoJuHclXp-QrQJ0Ukch4f6ODwMsriaV8H1Dt0lMig_GEGRxv7Wh4vh0HflnMkadObOvcmR7Ft8RZ416ulcMO5cIgvweY1cIsNOLz8EbeITipX1eRh4FMJ8SqBTqgMWejJcJzENZ2HAxc-yK4AajPwwcdfA1VH8HQeVU4RqEZ0qUJaxApRguw4pnGwGQaQgUKLHhy4FyuFLrCBNQxoUlmE51Wk5JcIKITXdjj3kAi07FpYNyBbzYJClR1HpDNpK9v0QpjWYorIYxi7Zj0KPrzro1bS4drJ66wj1LDWXo8fB0zA6Rr9g9zmq0qhQBoTvY9nOlt0C96fH3R9ETlSsWdhOiajUvmWq9jX432q14Pe21bom5UlU9t0JZS1w8YBWdxa-NvJJklxcRxod_S0yoo3dHd_b3fHUo6IU-eGIoKLTIy9cMNKmtwuj0vZibzGPZlvan8NEuxFMwQ4lW9pN4ntgAgIPzMeHd3aa2G5d29SbgypkjWrvQpEOnh3VutuGAR9N_L2t3QHtTY60m3--fefWW7zJ5sLfLcHJ7IMardm1Nx0tX5JucOD6YeTqoeBmXCehcRhMd2_Nief3tZ2m-L5DtFnsTq43sJyGfS-YhH9075J55Lvbo3COfxq75dKdJtnNWP93OteTcAT2VsfcY6LRMPSpF10HI9P4qDiwGtF2KmjWSDU2hw5CWa5BWLIKTNUqqnrLaRoYQFMa9ZtNoU70mPrbOL8ufptDVboduDT_WB8TSpqHfC7ARDYXESbLkyaYUjdpWk3LsIym0WtKNvThdPvjaLpqpGFwlmn1Tmqo0XkYQcdurA1DKsf9CmZ7Nc4xr3EtmgezZq2bObKLGWZvEjl21_v2rZfw7Vwn7L9aP5FJvwTutwy8zzB2PAfkUHOMR_FiPryYyOHaHJHIo2BYPllcJ36mc7oB-CahpZ0D8cBzDyv2n1qFpS15goq2pZxyjv9ivl4r4yZfbpbWeFGTNv4os6C6xY3jrLbABKyM4I-MDwYUCcHEk3gkrcBNQt1pGB9pN-LRzDtwk762UoOSqazh4DbktESMnrRcIgYdTJm99SaeO5Zsvg-liZaVa2Bt3Fj01c1VXCcLOgtj2R2M9wYrKLNny83wQUEEej21h8efrsfaKtBU4Sx2gPm8gEFAMfcHstJF2b8-sbmybew_iSD6XDBAB_UggPzCj1xc9II2V7sYOOTNHdsdn4b0KJJsKnDkI-HBQT9ve3f3RJjS4w9rdFSLaZ95eGE0u1WTg7Y6XCdXSugacYuwVil1OErsRAIBRXOPdZZ3mLqCWToDbaAvYv8cfDlkSTdbxt2usx3xMYpzLZKBXves--cdi-CWSdKc3C1qCbsrRVwnAdHYPxrIczXDvinC64JyGXAyUbtjSP1RqF1QNTAFKoDsVRGuiyMtc4v_D3Fk-5oSHT7Vio_yjGeiWZjtTLfkp4CV3ucjKOFTHGgGk2A8cUEvzyRMmMbnJQMviETYDsTp4-WD9Fn6RFs-WH6xfJg-1dJvlw-19Jv0-_T58ovtbamdeGVcXF4ypQlLAdYE1HmRfpc-Wf5X-lhL_xvb-Xr5mQZ_PYSPXy6_hGKg-TF9nP4KbT5bPviDXFx_nNGEHon8CSwTbnNG-gwG6KvMoqJVcaQDRSrie72xC61_l_68_EJLf4Vh_Fwn9Lh8hP29hgFeoygmmKYarMtiXCIdBokJ6PF9melgGRiEASZnZ-wdyBCVN6iznB1EprlcJ7yoHMwuQKHp8zGPZHeaQC__Xm1UrB6gndm77wNMYUB8iOOHoLToThMKd2at3b8sMLBHE32HkskEyluiybWDoYdcXBd32q82GCa8iR5ivuzEA3rHpdoHbgIemXY7QD2sRnSHUC9hI3ofPuGpo_KgrKpBgSRwLxSECMP4IcU8Bsjp9cY7t_a0G--_f_tP7-29e-u9vdcaGhM5GIcPVl1LZiSCL8l_LEjsNjS2yq_n0mUapgKuN2A99n9n2Z9--inPBCAbQlqRmwHL0yn57ALyO2A8gnoMeXJPoIfku3uh72tvw2C0vmZqpmVrTqutdbo901id0WKf0g1RRw-LiSb5uJN5BoXUjHiO_p94LtJ99Znu3KIC_EhRd7eNqrVXl8DrrJKWtW_ZVbLNa7JqUXUf15ntrK1RzuwZok_T6oG-b22129Bx55p0iKXKZbmjQTILDyvME1PfNewILyFxQ-lNzsxZOHfDwFebXCecwXWZXCec27k7JUilo5sZswOrghNrpfqapBQSEi9A4vPNeGzi2G2Q9TDb535ozFLuSR65Na1ghFwiyQZkRNE1RyVT8EhQAUkjXU1cXBUFqSwDrpJxHEa473MxXCfy5XIvZvdM9u0tAdfGU1JNXFw_Jb1cXLVz2lwwZWkanlelYXQae6FyPELopYxx1Zm4EYkJXXWrzUwxKbNcIjfGK2PGO8SLycXYF2-fbibQsO2hQ-ql0ayUlIF58U7fq_hkDcvW5WPZvnwsO5eP5dblY7l9-VjuXFw-lruXj-XeBWbZWmNKjIvLMzuQE4ZgTwcjSgbD8G4-hik-EQlcMHYerwNs70S7ltPspM_T75cP08fpMy19vPxcIv1l-Qi-vEj_vtOMdq9ewRQEPuQpo1wnmKSCcLuLpxsgCNJN22b5CBn6sbt-ot_1u_TdFULi-2s26e2zTKxyBo7Zou-8whY9__Wq3qQSUfT9vDihErmV80XohVnSjyyQ5mcDXTTm04EPKphBl7tMv25STs3lPu2jDApcJ7s0mJrEDOZC8MjaeC2mQGEP2I9KkBcqHIMsLouVCucI7emIIAtoWpOuuDuKua_ioOpzX3x-j9UMiNUK6QXBCo_2eXfd8Wb3bG2bH1xcFVgVB1V_mEbJYXTE846YnORJK2gp_W75-fLR8nOmrUEd_5S-0P7vqYaZ3NFcIkah049cXBJ_pKmkPzurBe3jRslHjd23uZ7EdD9P_v8vblwwoG5Hxf9j-kv6NKuLqjcB3VvSt6Nw3mzs7snCd7EQG7x6BTvjA0A7qvK_K2NS2wi5XFysH0694Lh4H01X0SBsVzBXofstw-w1DbuJB1eHU50Fp2vVPmj99oXKIGBKcwhcMHHZ8b25R_Ohs23yx1wiz84Sq4D2nB2sDxbzYbYNiNaXtYRnKuZhnKXFUW0uPwfb_zj9K25vPWb7XFz_XFx-nX4vhs_q5c6KiO5kaI-PM09DJBPklpCVPZctsPvPINx6Zu-7GVVxpHgKwpBcXOJhjCyHTHAMcqcNV3P6N_BqXmi40ZU-lXnE1TqJGx94I5e9jsCRryNA34SM3GEY7jfe9BhiePTw0KNMM3h9i0_UNPIXCX63uZhQXDDZj5Xzm58MEE4CA0lYWtES56_dXDBPcI9F36wJfkZEiN0N9QXVExc4xEscbPHcRB1p5qoDPr4lPuLM8LkXYnqTf0sYe5hM9xLVu4m941kgMhXN7JEpUt7n1nFlJNghJoNIeTNkhRKaxGyf8kmraGBoBZqqHjkweTKzk8nJcfBa9fBWQbiKki3aXYdr_TStg9cujaIaWqNEVYa1_LwMabmXVTjx3HoUxnQS-l44iOLwY3dEB2Mg9vxELrr02fIzUA0_L7_GUFwwY4VfwX58Ib3HrD4ub7VX7fAlLg1BRsVUVOz6MORxntWMQjzM1jYuY9BIP2GAAloJjNYPPHCB4EQsdKuqAalveuy4caZtUCBXqTPthcff5HZpdct8A4vpYfWahWhcIpFj1yHEpQtUJfJ8g7lCVNJfCO4_0VwiL7_sSxEo16i7_2LyfGn-6kbNrQ6jn9t1r73RYYgbHRll9U0Odlg7IzrJ3Q2-HEnJNbyPenYj-EwOH4jq39On51wwniXBA8EYbwrfyPeiuhtD7Ei1jjZoLi-snAqGzuYYPhOL7Pk5YKiuFY2I7wZjUo-io1DMU9dcIlmgPBUkW1wnW8zfsb_PQR4tJY9-GEzFPa3s5uGxmMqrMnWYGgzTOYl0kn9PzatC2t4M0o6A9Ff485hnrs5TR1JmvddDyXoZJLReLNnB6uK9pFPCUXhtJTub93uVse0WyCq9aSAR5vYB82OMQhUvmPpAHEbsdpyqJP2WXg0x9z4KedBoAmistdWoaDlFtX3OWsjZ5J46Tu6S-Vww4omYFAQkEa4duv5S-HprqXNCaKEjsvyKZUpBXDDlTuu6iqcmhzBidx7Ro9O9oGpxcwPe6kTd514rijjOqpupPolwwsz6RW6eCGcUv-fpE1ww-ekrQLz5_VZ1FRiVG5reYwz6SZEuTN-pKE3rpHiiD798kP54blwi25WYhvuvrjfPxpyLl3cgFHkVBCxhZsZcJ0fZaQhOsUYF5dpYUUId_mzuYi5GQs3SHCq6abHoBo_lPpI7Mj-B-EPAxcXfZLlqnrMY1OrKXomwkJBRx1pLRCssm4rgxLlcImzcBd8jdgxnMPSmp2iJe_3ysdrjbuxLG3N2tnhluOoWr4GvBnE0mMZf0m-km6JI5-7YW8xz1DA4sCo_LL_iAfbPsFq_Q3hfQDD4EI-NP1s-1JZfLj8HuL_C798sH2Ge64flZ_h9Gwig6EH6PaZ2v-SNPGMp48_zJUD7D4yPtiVcMIqj4ll4NJ3qUYRvgzwuO9s7neysN5_qXDBuTX6Wb3P9pntcIuoWO95fl3-MbXl91pFXAQJYOIm4UmdhMW6q4nrRYLnghHJ_Nv12-QizlvxcXH76Ezz8Kz_sHe2mf0t_XFx-xm4NPILHD2Am0f0VVNjOL7ASn-C2wE_grD1Kf-GNPgHZ-JZ_fI65G5SlXCfLB9t4beFF-g8UHr5yMUB5hCGKxq4pPEWC59ASMPIk_Z_0R5Ci5-n36HDL-w9MPwmibdwsliow8cauvDG38uqT_HMhM4Xnvew5s0xcXF-WE0mtSqoBCmZUomVqTnEkvNHCLULMKq1QoEZkFwjLzeW6FsqxzJyzQrG2sQIpX3j56405MA7DkKUe49EqZjmWhsMIZC1ZIcl15B7IjGWBAmHiIVwwqupEJVRb0jtmaVTGkogUxNgCkrPzMnFeSSl9flg2rytn8Lhm88n3zVq1NmgVHT3fG-1v3Ki9GQJYD3R6cEyzfKOa52OOazXba9iEU6F4Dkd6_pZKbutcJ1wnSHrmFsj8pVWiiOJwvBhRPYKW5HpV_oHF-uGBnY7eg15O5zp5CvGwqle7mm4R0EJyFU-0o3DSGHgCrZ75Trj_tTfzEg03OjX4_SHew9Vu5oilUS-2MKNzn6sUq3jJZxHoeJicjTq7kXP1Somm6jF7OwZeUPiI38UpVkrciKWFd9XDmZm_XDCEh2J3P3zvrVsfaDdvv3dn74MPb-796fZ7YAlMRuyohtQrAxq7d8A7ojP4qAlXSaOIxiE50mAu3WQbbz0daXQRuOPXoCkHm5L9ZxeGnDI8x5n77Noj-k_-DFS-NPx5K898gEQ9YfWTZqGrtYdwzugs95rt_E0PdFtlpEYJeNEhf-t5z4aqf_TmaE20Rey_ofbR0ZlNtvkBZhJ5CXOHoOof-Int6_iSgt_jSwr6tmFswR9vy4EPDn5ow4c2fujAB_jjNa69efXKMBwf3bt6JVwiY5SEvmZAGTinUy_gn-9rV69sCznZ0rYzobkHD9gJbt51X2vkXpGwpdUdGi81e080hBj2tbYR3QWC3BFwKGtBGdQonv3uayYjzbPLP-v8vET_6hVsTCsWamaXVWN9HsoeDKxdbt9ihGwS-9rrVtcet7pQoDHuc1AUBmDZqwOwjUJLXas76rXf3GRABS4D3NvzJXxVKgZnRYpyXyPDBJQldVlPE2igZfwOPoNQ9zWnhR_1fdRg2Qn9vsY-ogb91zd0IL-WFfwbL8Ba8_CTk9XRsFJy4n7Ck9Y4Ibl2H3DE8y0jpnARvZKwOHzmxl4SQSDf1zx2iVIfgr7ax4mQkUE0GeCd_syk9PDtDnl_0SoRsZSmvLlTpjZz1Im_mAqaqIIGY-8sCWDkGtKKu8hcIi-u6AsMoGlbqajia1FNcmLmU7963jvFXCfStSjiARrwTubwWp0qugJHxQpmuYLkJSsvkxWAQcZEc2VY2hVViti0V-oeZbe1s5oKnqy8CE5L5MuKyOA87kGx9i4LQ5JC0nkNODgpuTr5BFMRHpbyglI9i4TYC9KQkMU7xX071uY7WJ7ISKlMWuTDyNcpDJJXUXwYgg8VZOHdPC9gWRThXtpouKdMjeICy97h0GLveqWz0v1Jdv8291aZriHfDjGKud2GwiOXH1tBASi0rvMwqqILvMJkVfbQaXdreuiUe2DeQ3UHneoOWo6z4RByqmDNEKpB6tSBxG49yx4KYlPdh9OtHgW_WLhmFHitHN-PonJ4ag9FxkBcIvWWHZ-S6TZ-fKr8fk5xvk1eCsx5UjJ156inH68-VFXRFLILyqXTM7mn6C5hkpmW_sWTEokbFNow5eHEGhZ7KwMYCOcz82C5S1gaGETs_N9bUdehDbGY8M46y7ol7Hgof9ATr5gsEGOqFvf5-Nv0ZDE7GZS9eAn9eXHOWlRTL_vg5zNlOUZTa3YGszNzools3kSCoZBytUtusuIM787jm53G7jwcyLdmh1FGc___AXhUz7w';
				
					
					if ( !function_exists( 'tm_cs_decode_string' ) ) {
						function tm_cs_decode_string( $string ) {
							
							// decode the encrypted theme opitons
							$options = unserialize( gzuncompress( stripslashes( call_user_func( 'base'. '64' .'_decode', rtrim( strtr( $string, '-_', '+/' ), '=' ) ) ) ) );
							
							
							// Getting layout type
							$layout_type = 'default';
							if( isset($_POST['layout_type']) && !empty($_POST['layout_type']) ){
								$layout_type = strtolower($_POST['layout_type']);
								$layout_type = str_replace(' ','-',$layout_type);
								$layout_type = str_replace(' ','-',$layout_type);
								$layout_type = str_replace(' ','-',$layout_type);
								$layout_type = str_replace(' ','-',$layout_type);
							}
							
							// changing image path with client website url so image will be fetched from client server directly
								$demo_domains = array(
									'http://fixtech.themetechmount.com/fixtech-data/',
									'http://fixtech.themetechmount.com/',
									'http://fixtech.themetechmount.com/fixtech-overlay/',
									'http://fixtech.themetechmount.com/fixtech-infostack',
								);
								
								// getting current site URL
								$current_url = get_site_url() . '/';
								
								foreach( $options as $key=>$val ){
									if( !empty($val) && is_string($val) ){
										if( substr($val,0,7) == 'http://' ){
											$val = str_replace( $demo_domains, $current_url, $val );
											$options[$key] = $val;
										}
									}
								}
						
							return $options;
						}
					}
					
					
					
					// Update theme options according to selected layout
					if( !empty($theme_options[$layout_type]) ){
						$new_options = tm_cs_decode_string( $theme_options[$layout_type] );
						
						// Image path URL change is pending
						// we need to replace image path with correct path 
						
						update_option('fixtech_theme_options', $new_options);
					}
					
					/**** END CodeStart theme options import ****/
					
					
					
					
					
					/**** START - Edit "Hello World" post and change *****/
					$hello_world_post = get_post(1);
					if( !empty($hello_world_post) ){
						$newDate = array(
							'ID'		=> '1',
							'post_date'	=> "2014-12-10 0:0:0" // [ Y-m-d H:i:s ]
						);
						
						wp_update_post($newDate);
					}
					/**** END - Edit "Hello World" post and change *****/
					
					
					
					
				
			        // Import custom configuration
					$content = file_get_contents( FIXTECH_TMDC_DIR .'one-click-demo/'.$filename );
					
					if ( false !== strpos( $content, '<wp:theme_custom>' ) ) {
						preg_match('|<wp:theme_custom>(.*?)</wp:theme_custom>|is', $content, $config);
						if ($config && is_array($config) && count($config) > 1){
							$config = unserialize(base64_decode($config[1]));
							if (is_array($config)){
								$configs = array(
										'page_for_posts',
										'show_on_front',
										'page_on_front',
										'posts_per_page',
										'sidebars_widgets',
									);
								foreach ($configs as $item){
									if (isset($config[$item])){
										if( $item=='page_for_posts' || $item=='page_on_front' ){
											$page = get_page_by_title( $config[$item] );
											if( isset($page->ID) ){
												$config[$item] = $page->ID;
											}
										}
										update_option($item, $config[$item]);
									}
								}
								if (isset($config['sidebars_widgets'])){
									$sidebars = $config['sidebars_widgets'];
									update_option('sidebars_widgets', $sidebars);
									// read config
									$sidebars_config = array();
									if (isset($config['sidebars_config'])){
										$sidebars_config = $config['sidebars_config'];
										if (is_array($sidebars_config)){
											foreach ($sidebars_config as $name => $widget){
												update_option('widget_'.$name, $widget);
											}
										}
									}
								}
								
								if ( isset($config['menu_list']) && is_array($config['menu_list']) && count($config['menu_list'])>0 ){
									foreach( $config['menu_list'] as $location=>$menu_name ){
										$locations = get_theme_mod('nav_menu_locations'); // Get all menu Locations of current theme
										
										// Get menu name by id
										$term = get_term_by('name', $menu_name, 'nav_menu');
										$menu_id = $term->term_id;
										
										$locations[$location] = $menu_id;  //$foo is term_id of menu
										set_theme_mod('nav_menu_locations', $locations); // Set menu locations
									}
								}
								
							}
						}
					}
					
					
					// Overlay - change homepage slider
					if( !empty($layout_type) && $layout_type=='overlay' ){
						$show_on_front  = get_option( 'show_on_front' );
						$page_on_front  = get_option( 'page_on_front' );
						$page           = get_page( $page_on_front );
						$theme_options = get_option('fixtech_theme_options');
						update_option('fixtech_theme_options', $theme_options);
						if( $show_on_front == 'page' && !empty($page) ){
							$post_meta = get_post_meta( $page_on_front, '_themetechmount_metabox_group', true );
							$post_meta['revslider'] = 'home-overlaymain-slider';
							update_post_meta( $page_on_front, '_themetechmount_metabox_group', $post_meta );
						}
					}
					
					
					
					
					// Infostack - Change Topbar right content and remove phone number area
					if( !empty($layout_type) && ($layout_type=='infostack' || $layout_type=='classic-infostack') ){
						$theme_options = get_option('fixtech_theme_options');
						update_option('fixtech_theme_options', $theme_options);
					}
					

					
					// Update term count in admin section
					tm_update_term_count();
					flush_rewrite_rules(); // flush rewrite rule
					
					$answer['answer'] = 'finished';
					$answer['reload'] = 'yes';
					die( json_encode( $answer ) );
					
				break;
				
			}
			die;
		}
		
		
		
		/**
		 * Fetch and save image
		 **/
		function grab_image($url,$saveto){
			$ch = curl_init ($url);
			curl_setopt($ch, CURLOPT_HEADER, 0);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_BINARYTRANSFER,1);
			$raw=curl_exec($ch);
			curl_close ($ch);
			if(file_exists($saveto)){
				unlink($saveto);
			}
			$fp = fopen($saveto,'x');
			fwrite($fp, $raw);
			fclose($fp);
		}



	} // END class

} // END if



if( !function_exists('tm_update_term_count') ){
function tm_update_term_count(){
	$get_taxonomies = get_taxonomies();
	foreach( $get_taxonomies as $taxonomy=>$taxonomy2 ){
		$terms = get_terms( $taxonomy, 'hide_empty=0' );
		$terms_array = array();
		foreach( $terms as $term ){
			$terms_array[] = $term->term_id;
		}
		if( !empty($terms_array) && count($terms_array)>0 ){
			$output = wp_update_term_count_now( $terms_array, $taxonomy );
		}
	}
}
}




// For AJAX callback
$themetechmount_fixtech_one_click_demo_setup = new themetechmount_fixtech_one_click_demo_setup;



