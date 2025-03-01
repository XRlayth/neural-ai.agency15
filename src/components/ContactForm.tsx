import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const services = [
  'AI Chatbots',
  'Phone Callers',
  'Web Design',
  'Custom AI Solutions',
  'Process Automation',
  'Data Analytics'
];

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: '',
    message: '',
    additionalInfo: ''
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const { error: submitError } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            service: formData.service,
            message: formData.message,
            additional_info: formData.additionalInfo
          }
        ]);

      if (submitError) throw submitError;

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        service: '',
        message: '',
        additionalInfo: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="border border-white p-8 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-4 bg-black border border-white rounded-lg mb-4 focus:outline-none focus:border-white text-white"
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-4 bg-black border border-white rounded-lg mb-4 focus:outline-none focus:border-white text-white"
          />
        </div>
        <div>
          <select
            name="service"
            value={formData.service}
            onChange={handleChange}
            required
            className="w-full p-4 bg-black border border-white rounded-lg mb-4 focus:outline-none focus:border-white text-white"
          >
            <option value="">Select a Service</option>
            {services.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        </div>
        <div>
          <textarea
            name="message"
            placeholder="Message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full p-4 bg-black border border-white rounded-lg mb-4 focus:outline-none focus:border-white text-white"
          />
        </div>
        <div>
          <textarea
            name="additionalInfo"
            placeholder="Additional Information"
            value={formData.additionalInfo}
            onChange={handleChange}
            rows={3}
            className="w-full p-4 bg-black border border-white rounded-lg mb-4 focus:outline-none focus:border-white text-white"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full px-8 py-4 rounded-lg border border-white text-white font-bold hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
        >
          {status === 'submitting' ? 'Sending...' : 'Contact Us'}
        </button>
        {status === 'success' && (
          <p className="text-green-500 mt-4">Message sent successfully!</p>
        )}
        {status === 'error' && (
          <p className="text-red-500 mt-4">Error sending message. Please try again.</p>
        )}
      </form>
    </div>
  );
}

export default ContactForm;