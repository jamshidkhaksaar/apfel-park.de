<?php
	// Getting data of the  Facts in Digits box
	global $tm_global_fid_element_values;
	
	if( is_array($tm_global_fid_element_values) ) :
	
?>


<div class="tm-fid inside <?php echo themetechmount_sanitize_html_classes($tm_global_fid_element_values['main-class']); ?>">
	<?php echo themetechmount_wp_kses($tm_global_fid_element_values['lefticoncode'], 'fid_icon'); ?>
	<div class="tm-fld-contents">
		<h4 class="tm-fid-inner">
			<?php echo themetechmount_wp_kses($tm_global_fid_element_values['before_text']); ?>
			<span
				data-appear-animation = "animateDigits"
				data-from             = "0"
				data-to               = "<?php echo esc_attr($tm_global_fid_element_values['digit']); ?>"
				data-interval         = "<?php echo esc_attr($tm_global_fid_element_values['interval']); ?>"
				data-before           = "<?php echo esc_attr($tm_global_fid_element_values['before']); ?>"
				data-before-style     = "<?php echo esc_attr($tm_global_fid_element_values['beforetextstyle']); ?>"
				data-after            = "<?php echo esc_attr($tm_global_fid_element_values['after']); ?>"
				data-after-style      = "<?php echo esc_attr($tm_global_fid_element_values['aftertextstyle']); ?>"
				>
					<?php echo esc_attr($tm_global_fid_element_values['digit']); ?>
			</span>
			<?php echo themetechmount_wp_kses($tm_global_fid_element_values['after_text']); ?>
		</h4>
		<h3 class="tm-fid-title"><span><?php echo themetechmount_wp_kses($tm_global_fid_element_values['title']); ?><br></span></h3>
	</div><!-- .tm-fld-contents -->
	<?php echo themetechmount_wp_kses($tm_global_fid_element_values['righticoncode'], 'fid_icon'); ?>
</div>



<?php

	endif;
	
	// Resetting data of the Facts in Digits box
	$tm_global_fid_element_values = '';
?>