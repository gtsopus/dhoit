//-----------------------------------------------------------------------------------------------
// Implementation of "Deep Hybrid Order-Independent Trasparency" adapted from S-Buffer method 
// as described in "Deep Hybrid Order-Independent Trasparency" by G. Tsopouridis A. A. Vasilakis 
// and Ioannis Fudos.
//-----------------------------------------------------------------------------------------------

#extension GL_NV_fragment_shader_interlock : enable

layout(binding = 0, r32ui) coherent uniform uimage2D    image_counter;
layout(binding = 7, r32ui) coherent uniform uimage2D	pixel_fragment_counter;
layout(binding = 3, rgba32f) coherent uniform image2D  zMinMax;
layout(binding = 4, offset = 0)	    uniform atomic_uint total_counter;
layout(binding = 2, rgba32f) coherent uniform image2D  featureTex;
layout(binding = 1, r32ui) coherent uniform image2D  nearest_featureTex;

void incrementPixelFragmentCounter() {
     imageAtomicAdd(image_counter, ivec2(gl_FragCoord.xy), 1U);
}


vec4 computeColor(){}

void main()
{
	//Increase pixel fragment count
	incrementPixelFragmentCounter();
	
    	imageAtomicAdd(pixel_fragment_counter, ivec2(gl_FragCoord.xy), 1U);
	atomicCounterIncrement(total_counter);

	vec4 fragColor = computeColor();

	//Store input features
	beginInvocationInterlockNV();
	
	vec4 prevColor = imageLoad(featureTex,ivec2(gl_FragCoord.xy));
	vec4 addedColor = prevColor + vec4(fragColor.rgb,0.0f);
	imageStore(featureTex,ivec2(gl_FragCoord.xy),addedColor);
	
	vec4 minmaxes = imageLoad(zMinMax,ivec2(gl_FragCoord.xy));
	float localMin = minmaxes.r;
	float localMax = minmaxes.g;

	float globalMin = minmaxes.b;
	float globalMax = minmaxes.a;


	if(gl_FragCoord.z < localMin){
		localMin = gl_FragCoord.z;
		uint nearest = packUnorm4x8(fragColor);
		vec4 colorToStore = vec4(vec3(addedColor.rgb),0.0f);
		imageStore(featureTex,ivec2(gl_FragCoord.xy),colorToStore);
		imageStore(nearest_featureTex,ivec2(gl_FragCoord.xy),uvec4(nearest));
	}
	
	if(gl_FragCoord.z > localMax){
		localMax = gl_FragCoord.z;
	}

	if(gl_FragCoord.z < globalMin){
		globalMin = gl_FragCoord.z;
	}
	
	if(gl_FragCoord.z > globalMax){
		globalMax = gl_FragCoord.z;
	}

	imageStore(zMinMax,ivec2(gl_FragCoord.xy),vec4(localMin,localMax,globalMin,globalMax));
	endInvocationInterlockNV();
}
