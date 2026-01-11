<div class="tm-divcontent-wrapper">
	<div class="<?php echo themetechmount_sanitize_html_classes(themetechmount_header_container_class()); ?>">
		<div class="tm-info-widget">
			<?php themetechmount_infostack_header_content(); ?>
		</div>
		<div class="tm-phone">	
			<?php echo themetechmount_wp_kses( do_shortcode( themetechmount_get_option('classicinfo_phone_text') ) ); ?>
		</div>
	</div>
</div>