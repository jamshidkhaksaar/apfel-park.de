<?php
/**
 * Contact widget class with Icon
 *
 * @since 1.0
 */
class fixtech_contact_widget extends WP_Widget {


	/**
	 * Register widget with WordPress.
	 */
	function __construct() {
		$widget_style = array('classname'   => 'fixtech_contact_widget',
							  'description' => esc_attr__('Show Contact details with icons.', 'fixtech') );
							  
		$widget_define = array('show_id'   => 'themetechmount_single_contact',
							   'get_tips'  => 'true',
							   'get_title' => 'true');
							   
		$control_styles = array('width'   => 300,
								'height'  => 350,
								'id_base' => 'fixtech_contact_widget');
								
		$widget_change = array('change1' => 'delay',
							   'change2' => 'effect',
							   'change3' => 'slide',
							   'change4' => 100,
							   'change5' => 0);
							   
		parent::__construct(
			'fixtech_contact_widget', // Base ID
			esc_attr__('Fixtech Contact Widget', 'fixtech'), // Name
			$widget_style // Args
		);
	}


	function widget( $args, $cur_instance ) {
		extract( $args );
		
		$title   = apply_filters( 'widget_title', $cur_instance['title'] );
		$Phone   = $cur_instance['Phone'];
		$Email   = $cur_instance['Email'];
		$Website = $cur_instance['Website'];
		$Address = $cur_instance['Address'];
		$Time    = $cur_instance['Time'];
		
		
		/*
		 *  WPML Translation ready
		 */
		
		// Phone
		if ( function_exists( 'icl_register_string' ) ) {
			icl_register_string( 'Fixtech Contact Widget', 'Phone Number' . $this->id, $Phone );
		}
		if ( function_exists( 'icl_t' ) ) {
			$Phone = icl_t( 'Fixtech Contact Widget', 'Phone Number' . $this->id, $Phone );
		}
		
		// Email
		if ( function_exists( 'icl_register_string' ) ) {
			icl_register_string( 'Fixtech Contact Widget', 'Email Address' . $this->id, $Email );
		}
		if ( function_exists( 'icl_t' ) ) {
			$Email = icl_t( 'Fixtech Contact Widget', 'Email Address' . $this->id, $Email );
		}
		
		// Website
		if ( function_exists( 'icl_register_string' ) ) {
			icl_register_string( 'Fixtech Contact Widget', 'Website URL' . $this->id, $Website );
		}
		if ( function_exists( 'icl_t' ) ) {
			$Website = icl_t( 'Fixtech Contact Widget', 'Website URL' . $this->id, $Website );
		}
		
		// Address
		if ( function_exists( 'icl_register_string' ) ) {
			icl_register_string( 'Fixtech Contact Widget', 'Address' . $this->id, $Address );
		}
		if ( function_exists( 'icl_t' ) ) {
			$Address = icl_t( 'Fixtech Contact Widget', 'Address' . $this->id, $Address );
		}
		
		// Time
		if ( function_exists( 'icl_register_string' ) ) {
			icl_register_string( 'Fixtech Contact Widget', 'Time' . $this->id, $Time );
		}
		if ( function_exists( 'icl_t' ) ) {
			$Time = icl_t( 'Fixtech Contact Widget', 'Time' . $this->id, $Time );
		}
		
		
		echo wp_kses( /* HTML Filter */
			$before_widget,
			array(
				'aside' => array(
					'id'    => array(),
					'class' => array(),
				),
				'div' => array(
					'id'    => array(),
					'class' => array(),
				),
				'span' => array(
					'class' => array(),
				),
				'h2' => array(
					'class' => array(),
					'id'    => array(),
				),
				'h3' => array(
					'class' => array(),
					'id'    => array(),
				),
				'h4' => array(
					'class' => array(),
					'id'    => array(),
				),
				
			)
		);
		
		
		if ( !empty($title) ){
			$contact_widget_title = $before_title . $title . $after_title;
			echo wp_kses( /* HTML Filter */
				$contact_widget_title,
				array(
					'aside' => array(
						'id'    => array(),
						'class' => array(),
					),
					'div' => array(
						'id'    => array(),
						'class' => array(),
					),
					'span' => array(
						'class' => array(),
					),
					'h2' => array(
						'class' => array(),
						'id'    => array(),
					),
					'h3' => array(
						'class' => array(),
						'id'    => array(),
					),
					'h4' => array(
						'class' => array(),
						'id'    => array(),
					),
					
				)
			);
		}
		?>
		
		<ul class="fixtech_contact_widget_wrapper">
			<?php if( trim($Address)!='' ): ?><li class="themetechmount-contact-address tm-fixtech-icon-location">
			<?php 
				echo wp_kses( /* HTML Filter */
					nl2br($Address),
					array(
						'br'     => array(),
					)
				);
			?>
			</li><?php endif; ?>
			<?php if( trim($Email)!='' ): ?><li class="themetechmount-contact-email tm-fixtech-icon-mail"><?php echo '<a href="mailto:'.sanitize_email($Email).'" target="_blank">'.sanitize_email($Email).'</a>'; ?></li><?php endif; ?>
			<?php if( trim($Phone)!='' ): ?><li class="themetechmount-contact-phonenumber tm-fixtech-icon-phone">
			<?php 
				echo wp_kses( /* HTML Filter */
					nl2br($Phone),
					array(
						'br'     => array(),
					)
				);
			?>
			</li><?php endif; ?>
			<?php if( trim($Website)!='' ): ?><li class="themetechmount-contact-website  tm-fixtech-icon-world"><?php echo '<a href="'.esc_url(fixtech_addhttp($Website)).'" target="_blank">'.esc_url($Website).'</a>'; ?></li><?php endif; ?>
			<?php if( trim($Time)!='' ): ?><li class="themetechmount-contact-time tm-fixtech-icon-clock">
			<?php 
				echo wp_kses( /* HTML Filter */
					nl2br($Time),
					array(
						'br'     => array(),
					)
				);
			?></li><?php endif; ?>
		</ul>
		
		<?php
		echo wp_kses( /* HTML Filter */
			$after_widget,
			array(
				'aside' => array(
					'id'    => array(),
					'class' => array(),
				),
				'div' => array(
					'id'    => array(),
					'class' => array(),
				),
				'span' => array(
					'class' => array(),
				),
				'h2' => array(
					'class' => array(),
					'id'    => array(),
				),
				'h3' => array(
					'class' => array(),
					'id'    => array(),
				),
				'h4' => array(
					'class' => array(),
					'id'    => array(),
				),
				
			)
		);
		
	}
		
	function update( $new_instance, $org_instance ) {
		$cur_instance = $org_instance;
		$cur_instance['title']   = strip_tags( $new_instance['title'] );
		$cur_instance['Phone']   = strip_tags( $new_instance['Phone'] ); 
		$cur_instance['Email']   = sanitize_email($new_instance['Email']);
		$cur_instance['Website'] = esc_url($new_instance['Website']);
		$cur_instance['Address'] = strip_tags( $new_instance['Address'] ); 
		$cur_instance['Time']    = strip_tags( $new_instance['Time'] ); 
		return $cur_instance;
	}
		 
	function form( $cur_instance ) {
		$defaults = array('title'   => 'Get in touch',
					    //'class' => 'flickr',
						'Phone'   => '(+01) 123 456 7890',
						'Email'   => 'info@example.com',
						'Website' => 'www.example.com',
						'Address' => "Honey Business \n 24 Fifth st., Los Angeles, \n USA",
						'Time'    => "Mon to Sat - 9:00am to 6:00pm \n (Sunday Closed)",
		);
		
		$cur_instance = wp_parse_args( (array) $cur_instance, $defaults ); ?>

		<p>
			<label for="<?php echo esc_attr($this->get_field_id( 'title' )); ?>"><?php esc_attr_e('Title', 'fixtech'); ?>:</label>
			<input type="text" class="widefat" id="<?php echo esc_attr($this->get_field_id( 'title' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'title' )); ?>" value="<?php echo esc_attr($cur_instance['title']); ?>" />
		</p>
		
		<p>
			<label for="<?php echo esc_attr($this->get_field_id( 'Phone' )); ?>"><?php esc_attr_e('Phone', 'fixtech'); ?>:</label>
			<textarea class="widefat" id="<?php echo esc_attr($this->get_field_id( 'Phone' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'Phone' )); ?>"><?php echo esc_attr($cur_instance['Phone']); ?></textarea>
		</p>
		
		<p>
			<label for="<?php echo esc_attr($this->get_field_id( 'Email' )); ?>"><?php esc_attr_e('Email', 'fixtech'); ?>:</label>
			<input type="text" class="widefat" id="<?php echo esc_attr($this->get_field_id( 'Email' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'Email' )); ?>" value="<?php echo esc_attr($cur_instance['Email']); ?>" />
		</p>
		
		<p>
			<label for="<?php echo esc_attr($this->get_field_id( 'Website' )); ?>"><?php esc_attr_e('Website', 'fixtech'); ?>:</label>
			<input type="text" class="widefat" id="<?php echo esc_attr($this->get_field_id( 'Website' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'Website' )); ?>" value="<?php echo esc_attr($cur_instance['Website']); ?>" />
		</p>
		
		<p>
			<label for="<?php echo esc_attr($this->get_field_id( 'Address' )); ?>"><?php esc_attr_e('Address', 'fixtech'); ?>:</label>
			<textarea class="widefat" id="<?php echo esc_attr($this->get_field_id( 'Address' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'Address' )); ?>"><?php echo esc_attr($cur_instance['Address']); ?></textarea>
		</p>
		
		<p>
			<label for="<?php echo esc_attr($this->get_field_id( 'Time' )); ?>"><?php esc_attr_e('Time', 'fixtech'); ?>:</label>
			<textarea class="widefat" id="<?php echo esc_attr($this->get_field_id( 'Time' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'Time' )); ?>"><?php echo esc_attr($cur_instance['Time']); ?></textarea>
		</p>
		
		
		<?php
	}
}

register_widget( 'fixtech_contact_widget' );