//-----------------------------------------------------------------------------------------------
// Implementation of "Deep Hybrid Order-Independent Trasparency" adapted from S-Buffer method 
// as described in "Deep Hybrid Order-Independent Trasparency" by G. Tsopouridis A. A. Vasilakis 
// and Ioannis Fudos.
//-----------------------------------------------------------------------------------------------

#extension GL_NV_fragment_shader_interlock : enable

struct NodeTypeDataSB
{
    highp uint   color;
	highp float	 depth;
};


layout(binding = 0, r32ui ) readonly  uniform uimage2D		image_counter;
layout(binding = 1, r32ui)  uniform uimage2D				image_head;
layout(binding = 2, std430) buffer  SBUFFER					{NodeTypeDataSB nodes []; };
layout(binding = 3, r32ui)  uniform uimage2D				pixel_fragment_counter;
layout(binding = 4,	rgba32f) uniform image2D				avg_blend_color;
layout(binding = 5, std430)	coherent buffer  CPR_MAP		{uint head_cpr_s[];};
layout(binding = 7, r32ui)  uniform uimage2D				total_stored_k;

int hashFunction(ivec2 coords){
	return (coords.x + WIDTH * coords.y)%COUNTERS;
}

vec4 computeColor(){}

void main(void)
{	

	

	uint  page_id = imageLoad(image_head, ivec2(gl_FragCoord.xy)).x;
	int   hash_id = hashFunction(ivec2(gl_FragCoord.xy));
	uint  sum     = head_cpr_s[hash_id] + page_id;
	int   pixelK  = int(imageLoad(image_counter, ivec2(gl_FragCoord.xy)).x);
	int   total_frags = int(imageLoad(pixel_fragment_counter, ivec2(gl_FragCoord.xy)).x);

	uint  index = sum;
	
	//Max local array size of Variable K-Buffer, can be adjusted accordingly.
	if(pixelK > 32){
		pixelK = 32;
	}

	if(pixelK > total_frags){
		pixelK = total_frags;
	}
	
	float fragmentsD[32];
	uint  fragmentsC[32];

	beginInvocationInterlockNV();

	uint  storedK = imageLoad(total_stored_k, ivec2(gl_FragCoord.xy)).x;
	
	//Only approximate result
	if(pixelK == 0){
		
		vec4 blendColor = imageLoad(avg_blend_color,ivec2(gl_FragCoord.xy));

		vec4 color = computeColor();
		color.a = ALPHA_VALUE; //set alpha for accumulation
		blendColor = blendColor + vec4(color.rgb*color.a,color.a); //rgb color accumulation, a alpha accumulation
						
		imageStore(avg_blend_color,ivec2(gl_FragCoord.xy),vec4(blendColor));

	}

	else if(storedK == pixelK){
		for(int i=0;i<pixelK;i++){
			fragmentsD[i] = nodes[index+i].depth;
			fragmentsC[i] = nodes[index+i].color;
		}


		uint value = packUnorm4x8(computeColor());
		float depth = gl_FragCoord.z;

		uint tempC;
		float tempD;

		for(int i=0;i<pixelK;i++){
			if(depth <= fragmentsD[i] || fragmentsD[i] == 0.123f){
				tempC = value;
				tempD = depth;

				value = fragmentsC[i];
				depth = fragmentsD[i];

				fragmentsD[i] = tempD;
				fragmentsC[i] = tempC;
			}		
		}
		

		for(int i=0;i<pixelK;i++){
			nodes[index+i].color = fragmentsC[i];
			nodes[index+i].depth = fragmentsD[i];
		}

		vec4 blendColor = imageLoad(avg_blend_color,ivec2(gl_FragCoord.xy));

		float k = float(pixelK);
		float pf = float(total_frags);

		vec4 color = unpackUnorm4x8(value);
		color.a = ALPHA_VALUE; //set alpha for accumulation
		blendColor = blendColor + vec4(color.rgb*color.a,color.a); //rgb color accumulation, a alpha accumulation
						
		imageStore(avg_blend_color,ivec2(gl_FragCoord.xy),vec4(blendColor));

	}
	else{
		nodes[index+storedK].color = packUnorm4x8(computeColor());
		nodes[index+storedK].depth = gl_FragCoord.z;
		imageAtomicAdd(total_stored_k,ivec2(gl_FragCoord.xy),1U);
		
		if(storedK == pixelK-1){
			uint tempC;
			float tempD;
			
			for(int i=0;i<pixelK;i++){
				fragmentsD[i] = nodes[index+i].depth;
				fragmentsC[i] = nodes[index+i].color;
			}

			//bubble sort before insertion sort starts
			for (int i = (pixelK - 2); i >= 0; --i) {
				for (int j = 0; j <= i; ++j) {
					if (fragmentsD[j] > fragmentsD[j+1]) {
						tempC = fragmentsC[j+1];
						tempD = fragmentsD[j+1];

						fragmentsC[j+1] = fragmentsC[j];
						fragmentsD[j+1] = fragmentsD[j];

						fragmentsC[j] = tempC;
						fragmentsD[j] = tempD;
					}				
				}
			}
			for(int i=0;i<pixelK;i++){
				nodes[index+i].color = fragmentsC[i];
				nodes[index+i].depth = fragmentsD[i];
			}
		}
	}

	endInvocationInterlockNV();

}
