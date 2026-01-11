<?php

add_action( 'tgmpa_register', 'themetechmount_register_required_plugins' );

// Install Plugins when activate theme
function themetechmount_register_required_plugins(){
	/**
	 * Array of plugin arrays. Required keys are name and slug.
	 * If the source is NOT from the .org repo, then source is also required.
	 */
	$plugins = array(
		array(
			'name'     				=> esc_attr('WPBakery Page Builder'), // The plugin name
			'slug'     				=> esc_attr('js_composer'), // The plugin slug (typically the folder name)
			'source'   				=> get_template_directory() . '/inc/plugins/js_composer.zip', // The plugin source
			'required' 				=> true, // If false, the plugin is only 'recommended' instead of required
			'version' 				=> esc_attr('6.10.0'), // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
			'force_activation' 		=> false, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
			'force_deactivation' 	=> false, // If true, plugin is deactivated upon theme switch, useful for theme-specific plugins
			'external_url' 			=> '', // If set, overrides default API URL and points to an external URL
		),
		array(
			'name'     				=> esc_attr('Slider Revolution'), // The plugin name
			'slug'     				=> esc_attr('revslider'), // The plugin slug (typically the folder name)
			'source'   				=> get_template_directory() . '/inc/plugins/revslider.zip', // The plugin source
			'required' 				=> true,
			'version' 				=> esc_attr('6.6.7'), // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
			'force_activation' 		=> false,
			'force_deactivation' 	=> false,
			'external_url' 			=> '',
		),
		array(
			'name'     				=> esc_attr('Codestar Framework'), // The plugin name
			'slug'     				=> esc_attr('codestar-framework'), // The plugin slug (typically the folder name)
			'source'   				=> get_template_directory() . '/inc/plugins/codestar-framework.zip', // The plugin source
			'required' 				=> true,
			'version' 				=> '',
			'force_activation' 		=> false,
			'force_deactivation' 	=> false,
			'external_url' 			=> '',
		),
		array(
			'name'     				=> esc_attr('CF Post Formats'), // The plugin name
			'slug'     				=> esc_attr('cf-post-formats'), // The plugin slug (typically the folder name)
			'source'   				=> get_template_directory() . '/inc/plugins/cf-post-formats.zip', // The plugin source
			'required' 				=> true, // If false, the plugin is only 'recommended' instead of required
			'version' 				=> '', // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
			'force_activation' 		=> false, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
			'force_deactivation' 	=> false, // If true, plugin is deactivated upon theme switch, useful for theme-specific plugins
			'external_url' 			=> '', // If set, overrides default API URL and points to an external URL
		),
		array(
			'name'     				=> esc_attr('ThemetechMount Extras for Fixtech Theme'), // The plugin name
			'slug'     				=> esc_attr('themetechmount-fixtech-extras'), // The plugin slug (typically the folder name)
			'source'   				=> get_template_directory() . '/inc/plugins/themetechmount-fixtech-extras.zip', // The plugin source
			'required' 				=> true, // If false, the plugin is only 'recommended' instead of required
			'version' 				=> esc_attr('1.1'), // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
			'force_activation' 		=> false, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
			'force_deactivation' 	=> false, // If true, plugin is deactivated upon theme switch, useful for theme-specific plugins
			'external_url' 			=> '', // If set, overrides default API URL and points to an external URL
		),
		array(
			'name'     				=> esc_attr('ThemetechMount Fixtech Demo Content Setup'), // The plugin name
			'slug'     				=> esc_attr('themetechmount-fixtech-demo-content-setup'), // The plugin slug (typically the folder name)
			'source'   				=> get_template_directory() . '/inc/plugins/themetechmount-fixtech-demo-content-setup.zip', // The plugin source
			'required' 				=> true, // If false, the plugin is only 'recommended' instead of required
			'version' 				=> '', // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
			'force_activation' 		=> false, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
			'force_deactivation' 	=> false, // If true, plugin is deactivated upon theme switch, useful for theme-specific plugins
			'external_url' 			=> '', // If set, overrides default API URL and points to an external URL
		),
		array(
			'name'     				=> esc_attr('Envato Market'), // The plugin name
			'slug'     				=> esc_attr('envato-market'), // The plugin slug (typically the folder name)
			'source'   				=> get_template_directory() . '/inc/plugins/envato-market.zip', // The plugin source
			'required' 				=> true, // If false, the plugin is only 'recommended' instead of required
			'version' 				=> '', // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
			'force_activation' 		=> false, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
			'force_deactivation' 	=> false, // If true, plugin is deactivated upon theme switch, useful for theme-specific plugins
			'external_url' 			=> '', // If set, overrides default API URL and points to an external URL
		),
		array(
			'name'     => esc_attr('Breadcrumb NavXT'),
			'slug'     => esc_attr('breadcrumb-navxt'),
			'required' => true,
		),
		array(
			'name'     => esc_attr('Contact Form 7'),
			'slug'     => esc_attr('contact-form-7'),
			'required' => true,
		),
		array(
			'name'     => esc_attr('Enhanced Text Widget'),
			'slug'     => esc_attr('enhanced-text-widget'),
			'required' => false,
		),
		
	);

	

	/**
	 * Array of configuration settings. Amend each line as needed.
	 * If you want the default strings to be available under your own theme domain,
	 * leave the strings uncommented.
	 * Some of the strings are added into a sprintf, so see the comments at the
	 * end of each line for what each argument will be.
	 */
	$config = array(
		'id'			 => 'tgmpa', // Unique ID for hashing notices for multiple instances of TGMPA.
		'default_path'	 => '', // Default absolute path to pre-packaged plugins.
		'menu'			 => 'tgmpa-install-plugins', // Menu slug.
		'parent_slug'	 => 'themes.php', // Parent menu slug.
		'capability'	 => 'edit_theme_options', // Capability needed to view plugin install page, should be a capability associated with the parent menu used.
		'has_notices'	 => true, // Show admin notices or not.
		'dismissable'	 => true, // If false, a user cannot dismiss the nag message.
		'dismiss_msg'	 => '', // If 'dismissable' is false, this message will be output at top of nag.
		'is_automatic'	 => false, // Automatically activate plugins after installation or not.
		'message'		 => '', // Message to output right before the plugins table.
		'strings'		 => array(
			'page_title'						 => esc_attr__( 'Install Required Plugins', 'fixtech' ),
			'menu_title'						 => esc_attr__( 'Install Plugins', 'fixtech' ),
			'installing'						 => esc_attr__( 'Installing Plugin: %s', 'fixtech' ), // %s = plugin name.
			'oops'								 => esc_attr__( 'Something went wrong with the plugin API.', 'fixtech' ),
			'notice_can_install_required'		 => _n_noop(
			'This theme requires the following plugin: %1$s.', 'This theme requires the following plugins: %1$s.', 'fixtech'
			), // %1$s = plugin name(s).
			'notice_can_install_recommended'	 => _n_noop(
			'This theme recommends the following plugin: %1$s.', 'This theme recommends the following plugins: %1$s.', 'fixtech'
			), // %1$s = plugin name(s).
			'notice_cannot_install'				 => _n_noop(
			'Sorry, but you do not have the correct permissions to install the %1$s plugin.', 'Sorry, but you do not have the correct permissions to install the %1$s plugins.', 'fixtech'
			), // %1$s = plugin name(s).
			'notice_ask_to_update'				 => _n_noop(
			'The following plugin needs to be updated to its latest version to ensure maximum compatibility with this theme: %1$s.', 'The following plugins need to be updated to their latest version to ensure maximum compatibility with this theme: %1$s.', 'fixtech'
			), // %1$s = plugin name(s).
			'notice_ask_to_update_maybe'		 => _n_noop(
			'There is an update available for: %1$s.', 'There are updates available for the following plugins: %1$s.', 'fixtech'
			), // %1$s = plugin name(s).
			'notice_cannot_update'				 => _n_noop(
			'Sorry, but you do not have the correct permissions to update the %1$s plugin.', 'Sorry, but you do not have the correct permissions to update the %1$s plugins.', 'fixtech'
			), // %1$s = plugin name(s).
			'notice_can_activate_required'		 => _n_noop(
			'The following required plugin is currently inactive: %1$s.', 'The following required plugins are currently inactive: %1$s.', 'fixtech'
			), // %1$s = plugin name(s).
			'notice_can_activate_recommended'	 => _n_noop(
			'The following recommended plugin is currently inactive: %1$s.', 'The following recommended plugins are currently inactive: %1$s.', 'fixtech'
			), // %1$s = plugin name(s).
			'notice_cannot_activate'			 => _n_noop(
			'Sorry, but you do not have the correct permissions to activate the %1$s plugin.', 'Sorry, but you do not have the correct permissions to activate the %1$s plugins.', 'fixtech'
			), // %1$s = plugin name(s).
			'install_link'						 => _n_noop(
			'Begin installing plugin', 'Begin installing plugins', 'fixtech'
			),
			'update_link'						 => _n_noop(
			'Begin updating plugin', 'Begin updating plugins', 'fixtech'
			),
			'activate_link'						 => _n_noop(
			'Begin activating plugin', 'Begin activating plugins', 'fixtech'
			),
			'return'							 => esc_attr__( 'Return to Required Plugins Installer', 'fixtech' ),
			'plugin_activated'					 => esc_attr__( 'Plugin activated successfully.', 'fixtech' ),
			'activated_successfully'			 => esc_attr__( 'The following plugin was activated successfully:', 'fixtech' ),
			'plugin_already_active'				 => esc_attr__( 'No action taken. Plugin %1$s was already active.', 'fixtech' ), // %1$s = plugin name(s).
			'plugin_needs_higher_version'		 => esc_attr__( 'Plugin not activated. A higher version of %s is needed for this theme. Please update the plugin.', 'fixtech' ), // %1$s = plugin name(s).
			'complete'							 => esc_attr__( 'All plugins installed and activated successfully. %1$s', 'fixtech' ), // %s = dashboard link.
			'contact_admin'						 => esc_attr__( 'Please contact the administrator of this site for help.', 'fixtech' ),
			'nag_type'							 => 'updated', // Determines admin notice type - can only be 'updated', 'update-nag' or 'error'.
		)
	);
	tgmpa( $plugins, $config );
}
