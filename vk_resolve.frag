//-----------------------------------------------------------------------------------------------
// Implementation of "Deep Hybrid Order-Independent Trasparency" adapted from S-Buffer method 
// as described in "Deep Hybrid Order-Independent Trasparency" by G. Tsopouridis A. A. Vasilakis 
// and Ioannis Fudos.
//-----------------------------------------------------------------------------------------------

struct NodeTypeDataSB
{
    highp uint   color;
    highp float	 depth;
};

out vec4 FragColor;

layout(binding = 0, r32ui ) readonly  uniform uimage2D		image_counter;
layout(binding = 1, r32ui ) uniform	  uimage2D				image_head;
layout(binding = 2, std430) coherent  buffer  SBUFFER		{ NodeTypeDataSB nodes []; };
layout(binding = 4,	rgba32f) uniform image2D avg_blend_color;
layout(binding = 5, std430)	coherent  buffer  CPR_MAP		{uint head_cpr_s[];};
layout(binding = 3, r32ui)  uniform uimage2D				pixel_fragment_counter;

vec4 tailOnlyColor(int tee){
	vec4 bgColor = vec4(1.0f);

	vec4 blendColor = imageLoad(avg_blend_color,ivec2(gl_FragCoord.xy));

	vec4 tailColor = vec4(blendColor.rgb,0.0f)/blendColor.a;

	float aAvg = blendColor.a/float(tee);

	float tailTransmittance = pow((1-aAvg),tee);
	float aTail = 1 - tailTransmittance;

	return tailColor + (1-aTail)*bgColor;
}

vec4 blendFinalColor(vec4 fragmentList[8], int fragNumber,int tee){
	float fragmentAlpha = 0.33f;
	vec4 bgColor = vec4(1.0f);

	//Calculate (Blend) and output the final color using the locally-stored sorted fragments
	vec4 finalColor=vec4(0.0f);

	vec4 blendColor = imageLoad(avg_blend_color,ivec2(gl_FragCoord.xy));

	vec4 colorSum = vec4(0.0f);
	float alphaSum = 0.0f;

	for(int i=0; i<fragNumber; i++){
		vec4 frag=fragmentList[i];
	
		vec4 col;
		col.rgb=frag.rgb;
		col.a=fragmentAlpha;

		float alpha = col.a * (1-alphaSum); //visibility
		colorSum = colorSum + col*alpha;
		alphaSum = alphaSum + alpha;
	}
	if(tee>0){
		vec4 tailColor = vec4(blendColor.rgb,0.0f)/blendColor.a;

		float aAvg = blendColor.a/float(tee);

		float tailTransmittance = pow((1-aAvg),tee);
		float aTail = 1 - tailTransmittance;

		return colorSum+(1.0f-alphaSum)*(tailColor+(1-aTail)*bgColor);
	}
	else{
		return colorSum+(1.0f-alphaSum)*bgColor;	
	}
}

int hashFunction(ivec2 coords){
	return (coords.x + WIDTH * coords.y)%COUNTERS;
}

void main(void)
{	
	uint  page_id = imageLoad(image_head, ivec2(gl_FragCoord.xy)).x;
	int   hash_id = hashFunction(ivec2(gl_FragCoord.xy));
	uint  sum     = head_cpr_s[hash_id] + page_id;
	int   pixelK  = int(imageLoad(image_counter, ivec2(gl_FragCoord.xy)).x);
	int   total_frags = int(imageLoad(pixel_fragment_counter, ivec2(gl_FragCoord.xy)).x);


	if(pixelK <= 0 && total_frags <= 0){
		FragColor = vec4(1.0f); // or BG color
		return;
	}

	uint  index = sum;

	vec4 fragments[32];

	if(pixelK > 32){
		pixelK = 32;
	}
	if(total_frags < pixelK){
		pixelK = total_frags;
	}

	int tee = total_frags - pixelK;

	for(int i=0;i<pixelK;i++){
		fragments[i] = unpackUnorm4x8(nodes[index+i].color);
		fragments[i].a = nodes[index+i].depth;
	}

	FragColor = blendFinalColor(fragments,pixelK,tee);
	imageStore(avg_blend_color,ivec2(gl_FragCoord.xy),vec4(0.0f));
}