package com.terraai.aimobility.ride;

import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.RequiresApi;
import androidx.fragment.app.Fragment;

import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentWebViewBinding;


public class WebViewFragment extends Fragment {

    Context context;
    WebView webView;
    String url="www.google.com";
    String title;
    FragmentWebViewBinding binding;
    public WebViewFragment() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentWebViewBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        context=getContext();

        Bundle bundle=getArguments();
        if(bundle!=null){
            url=bundle.getString("url");
            title=bundle.getString("title");
        }


        view.findViewById(R.id.backBtn).setOnClickListener(v -> getActivity().onBackPressed());


        binding.titleTxt.setText(title);

        webView=view.findViewById(R.id.webview);
        webView.setWebChromeClient(new WebChromeClient(){
            @Override
            public void onProgressChanged(WebView view, int progress) {
                if(progress>=80){
                    binding.progressBar.setVisibility(View.GONE);
                }
            }
        });


        webView.getSettings().setJavaScriptEnabled(true);

        webView.loadUrl(url);


        webView.setWebViewClient(new WebViewClient() {
            @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request)  {
                String url = request.getUrl().toString();
                view.loadUrl(url);
                return false;
            }
        });

        return view;
    }
}