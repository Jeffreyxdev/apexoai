import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Mail, Settings, ExternalLink, Clock, MapPin, Building, TrendingUp, Filter, Bell } from 'lucide-react';

const JobScraperDashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [subscriptionEmail, setSubscriptionEmail] = useState('');
  const [subscriptionKeywords, setSubscriptionKeywords] = useState(['hiring', 'remote', 'developer']);
  const [newKeyword, setNewKeyword] = useState('');
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0 });
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    fetchJobs();
    loadUserPreferences();
  }, []);

  const fetchJobs = async (keyword = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/recent?limit=100&keyword=${keyword}`);
      const data = await response.json();
      
      if (data.jobs) {
        setJobs(data.jobs);
        calculateStats(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  type Job = {
  id: string;
  author: string;
  content: string;
  created_at: string;
  scraped_at: string;
  url: string;
  keywords?: string; // comma-separated
};


const calculateStats = (jobsList: Job[]): void => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayJobs = jobsList.filter((job: Job) => new Date(job.created_at) >= today).length;
  const weekJobs = jobsList.filter((job: Job) => new Date(job.created_at) >= thisWeek).length;

  setStats({
    total: jobsList.length,
    today: todayJobs,
    thisWeek: weekJobs,
  });
};


  const loadUserPreferences = () => {
    const savedEmail = localStorage.getItem('apexo_subscription_email');
    const savedKeywords = localStorage.getItem('apexo_keywords');
    
    if (savedEmail) {
      setSubscriptionEmail(savedEmail);
      setIsSubscribed(true);
    }
    if (savedKeywords) {
      setSubscriptionKeywords(JSON.parse(savedKeywords));
    }
  };

  const handleManualScrape = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs/manual-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        alert('Scraping completed! Refreshing job list...');
        await fetchJobs();
      } else {
        alert('Scraping failed: ' + data.output);
      }
    } catch (error) {
      console.error('Manual scrape error:', error);
      alert('Error starting job scraper');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!subscriptionEmail || subscriptionKeywords.length === 0) {
      alert('Please enter email and at least one keyword');
      return;
    }

    try {
      const response = await fetch('/api/jobs/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: subscriptionEmail,
          keywords: subscriptionKeywords
        })
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('apexo_subscription_email', subscriptionEmail);
        localStorage.setItem('apexo_keywords', JSON.stringify(subscriptionKeywords));
        setIsSubscribed(true);
        setShowSubscriptionModal(false);
        alert('Subscription saved! You\'ll receive job alerts via email.');
      } else {
        alert('Failed to save subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error saving subscription');
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !subscriptionKeywords.includes(newKeyword.trim())) {
      setSubscriptionKeywords([...subscriptionKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

 const removeKeyword = (keyword: string) => {
  setSubscriptionKeywords(subscriptionKeywords.filter((k) => k !== keyword));
};

const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  fetchJobs(searchTerm);
};

const handleFilter = (keyword: string) => {
  setFilterKeyword(keyword);
  fetchJobs(keyword);
};

 const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const getJobType = (content: string): string => {
  const contentLower = content.toLowerCase();
  if (contentLower.includes('remote')) return 'Remote';
  if (contentLower.includes('hybrid')) return 'Hybrid';
  if (contentLower.includes('on-site') || contentLower.includes('onsite')) return 'On-site';
  return 'Not specified';
};

const getJobLevel = (content: string): string => {
  const contentLower = content.toLowerCase();
  if (contentLower.includes('senior') || contentLower.includes('lead')) return 'Senior';
  if (contentLower.includes('junior') || contentLower.includes('entry')) return 'Junior';
  if (contentLower.includes('mid') || contentLower.includes('intermediate')) return 'Mid-level';
  return 'Not specified';
};


 const filteredJobs = jobs.filter((job) =>
  job.content.toLowerCase().includes(filterKeyword.toLowerCase()) ||
  job.author.toLowerCase().includes(filterKeyword.toLowerCase())
);

  const popularKeywords = ['hiring', 'remote', 'developer', 'engineer', 'manager', 'designer', 'analyst', 'marketing'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Job Scraper Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  isSubscribed 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Bell className="w-4 h-4 mr-2" />
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
              
              <button
                onClick={handleManualScrape}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Scraping...' : 'Refresh Jobs'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.total}</h3>
                <p className="text-gray-600">Total Jobs Found</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.today}</h3>
                <p className="text-gray-600">Posted Today</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.thisWeek}</h3>
                <p className="text-gray-600">This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search jobs by content, company, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </button>
            </form>
            
            {/* Quick Filter Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 mr-2">Quick filters:</span>
              {popularKeywords.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => handleFilter(keyword)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filterKeyword === keyword
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {keyword}
                </button>
              ))}
              {filterKeyword && (
                <button
                  onClick={() => handleFilter('')}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Job Postings ({filteredJobs.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading jobs...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                {filterKeyword ? `No jobs match "${filterKeyword}"` : 'No job postings available'}
              </p>
              <button
                onClick={handleManualScrape}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Scraping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">
                          @{job.author}
                        </h3>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDate(job.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          getJobType(job.content) === 'Remote' 
                            ? 'bg-green-100 text-green-800'
                            : getJobType(job.content) === 'Hybrid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {getJobType(job.content)}
                        </span>
                        
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          {getJobLevel(job.content)}
                        </span>
                        
                        {job.keywords && job.keywords.split(',').map((keyword, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </a>
                    </div>
                  </div>
                  
                  <div className="text-gray-700 mb-3">
                    <p className="line-clamp-3">{job.content}</p>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Scraped {formatDate(job.scraped_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Job Alert Subscription</h3>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={subscriptionEmail}
                  onChange={(e) => setSubscriptionEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords to Watch
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {subscriptionKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600">
                      <li>We'll scan Twitter for job posts matching your keywords</li>
                      <li>New matches will be sent to your email immediately</li>
                      <li>You can update your preferences anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubscribe}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isSubscribed ? 'Update Subscription' : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobScraperDashboard;